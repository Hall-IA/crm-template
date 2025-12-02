import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  getValidAccessToken,
  createGoogleCalendarEvent,
  extractMeetLink,
} from '@/lib/google-calendar';
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

/**
 * POST /api/contacts/[id]/meet
 * Crée un Google Meet depuis un contact
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { id: contactId } = await params;
    const body = await request.json();
    const {
      title,
      description,
      scheduledAt,
      durationMinutes = 30,
      attendees = [],
      reminderMinutesBefore,
    } = body;

    // Validation
    if (!title || !scheduledAt) {
      return NextResponse.json(
        { error: 'Le titre et la date/heure sont requis' },
        { status: 400 }
      );
    }

    // Vérifier que le contact existe
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
      select: { id: true, email: true, firstName: true, lastName: true },
    });

    if (!contact) {
      return NextResponse.json({ error: 'Contact non trouvé' }, { status: 404 });
    }

    // Vérifier que l'utilisateur a un compte Google connecté
    const googleAccount = await prisma.userGoogleAccount.findUnique({
      where: { userId: session.user.id },
    });

    if (!googleAccount) {
      return NextResponse.json(
        { error: 'Veuillez connecter votre compte Google dans les paramètres' },
        { status: 400 }
      );
    }

    // Obtenir un token valide
    const accessToken = await getValidAccessToken(
      googleAccount.accessToken,
      googleAccount.refreshToken,
      googleAccount.tokenExpiresAt
    );

    // Mettre à jour le token si nécessaire
    if (accessToken !== googleAccount.accessToken) {
      const tokenExpiresAt = new Date();
      tokenExpiresAt.setSeconds(tokenExpiresAt.getSeconds() + 3600);
      await prisma.userGoogleAccount.update({
        where: { userId: session.user.id },
        data: {
          accessToken,
          tokenExpiresAt,
        },
      });
    }

    // Préparer les dates pour Google Calendar
    const startDate = new Date(scheduledAt);
    const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

    // Construire la liste des invités (contact + invités additionnels)
    const allAttendees = [];
    if (contact.email) {
      allAttendees.push({ email: contact.email });
    }
    // Ajouter les autres invités
    attendees.forEach((email: string) => {
      if (email && email !== contact.email) {
        allAttendees.push({ email });
      }
    });

    // Créer l'évènement Google Calendar avec Meet
    const googleEvent = await createGoogleCalendarEvent(accessToken, {
      summary: title,
      description: description || '',
      start: {
        dateTime: startDate.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      attendees: allAttendees.length > 0 ? allAttendees : undefined,
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet',
          },
        },
      },
      conferenceDataVersion: 1,
    });

    const meetLink = extractMeetLink(googleEvent);

    // Créer la tâche dans le CRM
    const task = await prisma.task.create({
      data: {
        type: 'MEETING',
        title,
        description: description || '',
        priority: 'MEDIUM',
        scheduledAt: startDate,
        reminderMinutesBefore: reminderMinutesBefore || null,
        contactId: contactId,
        assignedUserId: session.user.id,
        createdById: session.user.id,
        googleEventId: googleEvent.id,
        googleMeetLink: meetLink,
        durationMinutes,
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

    // Créer aussi une interaction pour le contact
    await prisma.interaction.create({
      data: {
        contactId,
        type: 'MEETING',
        title: `Google Meet: ${title}`,
        content: description || `Réunion Google Meet programmée${meetLink ? `\n\nLien: ${meetLink}` : ''}`,
        userId: session.user.id,
        date: startDate,
      },
    });

    // Envoyer l'email de confirmation au contact si un email est disponible
    if (contact.email && meetLink) {
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

          const contactName = `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Cher client';
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

          const formatDuration = (minutes: number) => {
            if (minutes < 60) {
              return `${minutes} minutes`;
            }
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            if (mins === 0) {
              return `${hours} heure${hours > 1 ? 's' : ''}`;
            }
            return `${hours} heure${hours > 1 ? 's' : ''} ${mins} minute${mins > 1 ? 's' : ''}`;
          };

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
                  <h2 style="color: #1a1a1a; font-size: 20px; margin-bottom: 15px;">${title}</h2>
                  <div style="margin-bottom: 10px;"><strong>Date :</strong> ${formatDate(startDate)}</div>
                  <div style="margin-bottom: 10px;"><strong>Heure :</strong> ${formatTime(startDate)}</div>
                  <div style="margin-bottom: 10px;"><strong>Durée :</strong> ${formatDuration(durationMinutes)}</div>
                  <div style="margin-bottom: 10px;"><strong>Organisateur :</strong> ${organizerName}</div>
                  ${description ? `
                    <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd;">
                      <strong>Description :</strong>
                      <div style="margin-top: 10px;">${description}</div>
                    </div>
                  ` : ''}
                </div>
                <div style="margin-bottom: 30px; text-align: center;">
                  <a href="${meetLink}" style="display: inline-block; background-color: #4285f4; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-size: 16px; font-weight: bold;">
                    Rejoindre la réunion Google Meet
                  </a>
                </div>
                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd;">
                  <p style="font-size: 14px; color: #666;">
                    <strong>Lien de la réunion :</strong><br>
                    <a href="${meetLink}" style="color: #4285f4; word-break: break-all;">${meetLink}</a>
                  </p>
                </div>
                ${smtpConfig.signature ? `
                  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 14px;">
                    ${smtpConfig.signature}
                  </div>
                ` : ''}
                <p style="font-size: 14px; color: #666; margin-top: 30px;">
                  Cordialement,<br>
                  ${organizerName}
                </p>
              </div>
            </div>
          `;

          // Générer le contenu texte de l'email
          const emailText = `
Confirmation de rendez-vous

Bonjour ${contactName},

Votre rendez-vous a été confirmé avec succès.

${title}

Date : ${formatDate(startDate)}
Heure : ${formatTime(startDate)}
Durée : ${formatDuration(durationMinutes)}
Organisateur : ${organizerName}

${description ? `Description :\n${htmlToText(description)}\n` : ''}

Lien de la réunion : ${meetLink}

Cordialement,
${organizerName}
${smtpConfig.signature ? `\n\n${htmlToText(smtpConfig.signature)}` : ''}
          `.trim();

          // Envoyer l'email
          await transporter.sendMail({
            from: smtpConfig.fromName
              ? `"${smtpConfig.fromName}" <${smtpConfig.fromEmail}>`
              : smtpConfig.fromEmail,
            to: contact.email,
            subject: `Confirmation de rendez-vous : ${title}`,
            text: emailText,
            html: emailHtml,
          });
        }
      } catch (emailError: any) {
        // Ne pas faire échouer la création du Meet si l'email échoue
        console.error('Erreur lors de l\'envoi de l\'email de confirmation:', emailError);
      }
    }

    return NextResponse.json(task, { status: 201 });
  } catch (error: any) {
    console.error('Erreur lors de la création du Google Meet:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}

