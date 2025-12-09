import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAppointmentCreated, createInteraction } from '@/lib/contact-interactions';
import nodemailer from 'nodemailer';
import { decrypt } from '@/lib/encryption';

function htmlToText(html: string): string {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// GET /api/tasks - Récupérer les tâches de l'utilisateur
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const assignedTo = searchParams.get('assignedTo'); // Pour les admins
    const contactId = searchParams.get('contactId'); // Filtrer par contact

    // Construire les filtres
    const where: any = {
      scheduledAt: {
        gte: startDate ? new Date(startDate) : new Date(),
        lte: endDate ? new Date(endDate) : undefined,
      },
    };

    // Filtrer par contact si fourni
    if (contactId) {
      where.contactId = contactId;
    }

    // Si admin demande les tâches d'un autre utilisateur
    if (assignedTo && assignedTo !== session.user.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      });
      if (user?.role === 'ADMIN') {
        where.assignedUserId = assignedTo;
      } else {
        // Non-admin ne peut voir que ses propres tâches
        where.assignedUserId = session.user.id;
      }
    } else {
      // Par défaut, voir ses propres tâches
      where.assignedUserId = session.user.id;
    }

    if (!endDate) {
      delete where.scheduledAt.lte;
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        scheduledAt: 'asc',
      },
    });

    return NextResponse.json(tasks);
  } catch (error: any) {
    console.error('Erreur lors de la récupération des tâches:', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/tasks - Créer une nouvelle tâche
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const {
      type,
      title,
      description,
      priority,
      scheduledAt,
      contactId,
      assignedUserId,
      reminderMinutesBefore,
      notifyContact,
    } = body;

    // Validation
    if (!type || !description || !scheduledAt) {
      return NextResponse.json(
        { error: 'Le type, la description et la date sont requis' },
        { status: 400 },
      );
    }

    // Vérifier si l'utilisateur est admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    // Déterminer l'utilisateur assigné
    let finalAssignedUserId: string;
    if (assignedUserId && user?.role === 'ADMIN') {
      // Admin peut assigner à n'importe qui
      finalAssignedUserId = assignedUserId;
    } else {
      // Utilisateur normal s'assigne automatiquement
      finalAssignedUserId = session.user.id;
    }

    // Vérifier que le contact existe si fourni
    if (contactId) {
      const contact = await prisma.contact.findUnique({
        where: { id: contactId },
      });
      if (!contact) {
        return NextResponse.json({ error: 'Contact non trouvé' }, { status: 404 });
      }
    }

    // Créer la tâche
    const task = await prisma.task.create({
      data: {
        type,
        title: title || null,
        description,
        priority: priority || 'MEDIUM',
        scheduledAt: new Date(scheduledAt),
        contactId: contactId || null,
        assignedUserId: finalAssignedUserId,
        createdById: session.user.id,
        reminderMinutesBefore:
          typeof reminderMinutesBefore === 'number' ? reminderMinutesBefore : null,
        notifyContact: notifyContact === true,
      },
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Si la tâche est liée à un contact, créer aussi une interaction
    if (contactId) {
      try {
        if (type === 'MEETING') {
          // Pour les rendez-vous, utiliser la fonction spécialisée
          await logAppointmentCreated(
            contactId,
            task.id,
            new Date(scheduledAt),
            title,
            session.user.id,
          );

          // Envoyer un email de notification si demandé
          if (notifyContact && task.contact?.email) {
            try {
              // Récupérer la configuration SMTP
              const smtpConfig = await prisma.smtpConfig.findUnique({
                where: { userId: session.user.id },
              });

              if (smtpConfig) {
                // Déchiffrer le mot de passe SMTP
                let password: string;
                try {
                  password = decrypt(smtpConfig.password);
                } catch (error) {
                  password = smtpConfig.password;
                }

                // Créer le transporteur SMTP
                const transporter = nodemailer.createTransport({
                  host: smtpConfig.host,
                  port: smtpConfig.port,
                  secure: smtpConfig.secure,
                  auth: {
                    user: smtpConfig.username,
                    pass: password,
                  },
                });

                // Récupérer le nom de l'organisateur
                const organizer = await prisma.user.findUnique({
                  where: { id: session.user.id },
                  select: { name: true },
                });

                const contactName =
                  `${task.contact.firstName || ''} ${task.contact.lastName || ''}`.trim() ||
                  'Cher client';
                const organizerName = organizer?.name || session.user.name || 'Organisateur';

                const formatDate = (date: Date) => {
                  return date.toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  });
                };

                const formatTime = (date: Date) => {
                  return date.toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                };

                const scheduledDate = new Date(scheduledAt);

                // Générer le contenu HTML de l'email
                const emailHtml = `
                  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                      <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 20px;">
                        Confirmation de rendez-vous
                      </h1>
                      <p style="font-size: 16px; margin-bottom: 20px;">Bonjour ${contactName},</p>
                      <p style="font-size: 16px; margin-bottom: 20px;">
                        Votre rendez-vous a été confirmé avec succès.
                      </p>
                      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <h2 style="color: #1a1a1a; font-size: 20px; margin-bottom: 15px;">${title || 'Rendez-vous'}</h2>
                        <div style="margin-bottom: 10px;"><strong>Date :</strong> ${formatDate(scheduledDate)}</div>
                        <div style="margin-bottom: 10px;"><strong>Heure :</strong> ${formatTime(scheduledDate)}</div>
                        <div style="margin-bottom: 10px;"><strong>Organisateur :</strong> ${organizerName}</div>
                        ${
                          description
                            ? `
                          <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd;">
                            <strong>Description :</strong>
                            <div style="margin-top: 10px;">${description}</div>
                          </div>
                        `
                            : ''
                        }
                      </div>
                      <p style="font-size: 14px; color: #666; margin-top: 20px;">
                        Nous vous remercions de votre confiance et restons à votre disposition pour toute question.
                      </p>
                    </div>
                  </div>
                `;

                const emailText = htmlToText(emailHtml);

                // Ajouter la signature si définie
                let finalHtml = emailHtml;
                let finalText = emailText;
                if (smtpConfig.signature) {
                  const signatureContent = smtpConfig.signature.trim();
                  if (emailHtml.length > 0) {
                    finalHtml = `${emailHtml}<br>${signatureContent}`;
                  } else {
                    finalHtml = signatureContent;
                  }
                  finalText = `${emailText}\n\n${htmlToText(signatureContent)}`;
                }

                // Envoyer l'email
                await transporter.sendMail({
                  from: smtpConfig.fromName
                    ? `"${smtpConfig.fromName}" <${smtpConfig.fromEmail}>`
                    : smtpConfig.fromEmail,
                  to: task.contact.email,
                  subject: `Confirmation de rendez-vous${title ? ` : ${title}` : ''}`,
                  text: finalText,
                  html: finalHtml,
                });
              }
            } catch (emailError: any) {
              // Ne pas faire échouer la création de la tâche si l'email échoue
              console.error("Erreur lors de l'envoi de l'email de notification:", emailError);
            }
          }
        } else {
          // Pour les autres types de tâches, créer une interaction standard
          const interactionTypeMap: Record<string, string> = {
            CALL: 'CALL',
            EMAIL: 'EMAIL',
            OTHER: 'NOTE',
          };

          await createInteraction({
            contactId,
            type: (interactionTypeMap[type] || 'NOTE') as any,
            title: title || `Tâche ${type}`,
            content: description,
            userId: session.user.id,
            date: new Date(scheduledAt),
          });
        }
      } catch (error) {
        // Ne pas faire échouer la création de la tâche si l'interaction échoue
        console.error("Erreur lors de la création de l'interaction:", error);
      }
    }

    return NextResponse.json(task, { status: 201 });
  } catch (error: any) {
    console.error('Erreur lors de la création de la tâche:', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}
