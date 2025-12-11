import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  getValidAccessToken,
  updateGoogleCalendarEvent,
  extractMeetLink,
  deleteGoogleCalendarEvent,
  getGoogleCalendarEvent,
} from '@/lib/google-calendar';
import nodemailer from 'nodemailer';
import { decrypt } from '@/lib/encryption';
import { logAppointmentCancelled, logAppointmentChanged } from '@/lib/contact-interactions';
import { render } from '@react-email/render';
import { MeetUpdateEmailTemplate } from '@/components/meet-update-email-template';
import { MeetCancellationEmailTemplate } from '@/components/meet-cancellation-email-template';
import React from 'react';

function htmlToText(html: string): string {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// GET /api/tasks/[id] - Récupérer une tâche spécifique
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { id } = await params;

    const task = await prisma.task.findUnique({
      where: { id },
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

    if (!task) {
      return NextResponse.json({ error: 'Tâche non trouvée' }, { status: 404 });
    }

    // Vérifier que l'utilisateur peut voir cette tâche
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (task.assignedUserId !== session.user.id && user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    return NextResponse.json(task);
  } catch (error: any) {
    console.error('Erreur lors de la récupération de la tâche:', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}

// PUT /api/tasks/[id] - Mettre à jour une tâche
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      type,
      title,
      description,
      priority,
      scheduledAt,
      assignedUserId,
      completed,
      reminderMinutesBefore,
      durationMinutes,
      attendees,
      notifyContact,
      internalNote,
    } = body;

    // Vérifier que la tâche existe
    const existingTask = await prisma.task.findUnique({
      where: { id },
    });

    if (!existingTask) {
      return NextResponse.json({ error: 'Tâche non trouvée' }, { status: 404 });
    }

    // Vérifier les permissions
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (existingTask.assignedUserId !== session.user.id && user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Préparer les données de mise à jour
    const updateData: any = {};
    if (type !== undefined) updateData.type = type;
    if (title !== undefined) updateData.title = title || null;
    if (description !== undefined) updateData.description = description;
    if (priority !== undefined) updateData.priority = priority;
    if (scheduledAt !== undefined) updateData.scheduledAt = new Date(scheduledAt);
    if (reminderMinutesBefore !== undefined) {
      updateData.reminderMinutesBefore =
        typeof reminderMinutesBefore === 'number' ? reminderMinutesBefore : null;
    }
    if (durationMinutes !== undefined) {
      updateData.durationMinutes = durationMinutes || null;
    }
    if (notifyContact !== undefined) {
      updateData.notifyContact = notifyContact === true;
    }
    if (internalNote !== undefined) {
      updateData.internalNote = internalNote || null;
    }
    if (completed !== undefined) {
      updateData.completed = completed;
      updateData.completedAt = completed ? new Date() : null;
    }

    // Seuls les admins peuvent changer l'assignation
    if (assignedUserId !== undefined && user?.role === 'ADMIN') {
      updateData.assignedUserId = assignedUserId;
    }

    // Si la tâche a un googleEventId, synchroniser avec Google Calendar
    if (existingTask.googleEventId) {
      try {
        const googleAccount = await prisma.userGoogleAccount.findUnique({
          where: { userId: session.user.id },
        });

        if (googleAccount) {
          const accessToken = await getValidAccessToken(
            googleAccount.accessToken,
            googleAccount.refreshToken,
            googleAccount.tokenExpiresAt,
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

          // Préparer les données de mise à jour pour Google Calendar
          const googleUpdate: any = {};
          if (title !== undefined) googleUpdate.summary = title;
          if (description !== undefined) googleUpdate.description = description;

          if (scheduledAt !== undefined) {
            const startDate = new Date(scheduledAt);
            const duration = durationMinutes || existingTask.durationMinutes || 30;
            const endDate = new Date(startDate.getTime() + duration * 60 * 1000);

            googleUpdate.start = {
              dateTime: startDate.toISOString(),
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            };
            googleUpdate.end = {
              dateTime: endDate.toISOString(),
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            };
          }

          // Mettre à jour les invités si fournis
          if (attendees !== undefined && Array.isArray(attendees)) {
            // Récupérer le contact pour l'inclure dans la liste
            const contact = existingTask.contactId
              ? await prisma.contact.findUnique({
                  where: { id: existingTask.contactId },
                  select: { email: true },
                })
              : null;

            // Construire la liste des invités (contact + invités additionnels)
            const allAttendees = [];
            if (contact?.email) {
              allAttendees.push({ email: contact.email });
            }
            // Ajouter les autres invités (exclure le contact s'il est déjà dans la liste)
            attendees.forEach((email: string) => {
              if (email && email.trim() !== '' && email !== contact?.email) {
                allAttendees.push({ email: email.trim() });
              }
            });

            googleUpdate.attendees = allAttendees.length > 0 ? allAttendees : undefined;
          }

          // Mettre à jour l'évènement Google Calendar
          const updatedGoogleEvent = await updateGoogleCalendarEvent(
            accessToken,
            existingTask.googleEventId,
            googleUpdate,
          );

          // Mettre à jour le lien Meet si nécessaire
          const meetLink = extractMeetLink(updatedGoogleEvent);
          if (meetLink) {
            updateData.googleMeetLink = meetLink;
          }
        }
      } catch (googleError: any) {
        console.error('Erreur lors de la synchronisation avec Google Calendar:', googleError);
        // On continue quand même la mise à jour de la tâche locale
      }
    }

    // Vérifier si la date/heure ou la durée a changé pour un Google Meet
    const hasDateChanged = Boolean(
      existingTask.googleEventId &&
        scheduledAt !== undefined &&
        new Date(scheduledAt).getTime() !== existingTask.scheduledAt.getTime(),
    );
    const hasDurationChanged = Boolean(
      existingTask.googleEventId &&
        durationMinutes !== undefined &&
        durationMinutes !== existingTask.durationMinutes,
    );

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
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

    // Créer une interaction pour la modification si c'est un rendez-vous
    if (
      task.contactId &&
      (existingTask.type === 'MEETING' || existingTask.type === 'VIDEO_CONFERENCE')
    ) {
      try {
        await logAppointmentChanged(
          task.contactId,
          task.id,
          task.scheduledAt,
          task.title,
          session.user.id,
          existingTask.type === 'VIDEO_CONFERENCE',
        );
      } catch (interactionError: any) {
        console.error(
          "Erreur lors de la création de l'interaction de modification:",
          interactionError,
        );
        // On continue même si l'interaction échoue
      }
    }

    // Déterminer si on doit envoyer un email de modification
    const shouldNotifyForGoogleMeet =
      existingTask.googleEventId && task.contact?.email && (hasDateChanged || hasDurationChanged);

    // Pour les rendez-vous physiques, envoyer un email si :
    // - Le contact avait été prévenu initialement (existingTask.notifyContact === true)
    // - OU l'utilisateur demande explicitement de prévenir (notifyContact === true)
    const shouldNotifyForPhysicalMeeting =
      existingTask.type === 'MEETING' &&
      !existingTask.googleEventId &&
      task.contact?.email &&
      (existingTask.notifyContact === true || notifyContact === true);

    // Envoyer un email de modification si nécessaire
    if (shouldNotifyForGoogleMeet || shouldNotifyForPhysicalMeeting) {
      try {
        // Récupérer la configuration SMTP
        const smtpConfig = await prisma.smtpConfig.findUnique({
          where: { userId: session.user.id },
        });

        if (smtpConfig && task.googleMeetLink) {
          // Récupérer les invités depuis Google Calendar
          let allRecipients: string[] = [];
          if (task.contact?.email) {
            allRecipients.push(task.contact.email);
          }

          // Pour Google Meet uniquement, récupérer les invités depuis Google Calendar
          if (existingTask.googleEventId && task.googleMeetLink) {
            try {
              const googleAccount = await prisma.userGoogleAccount.findUnique({
                where: { userId: session.user.id },
              });

              if (googleAccount && existingTask.googleEventId) {
                const accessToken = await getValidAccessToken(
                  googleAccount.accessToken,
                  googleAccount.refreshToken,
                  googleAccount.tokenExpiresAt,
                );

                const googleEvent = await getGoogleCalendarEvent(
                  accessToken,
                  existingTask.googleEventId,
                );
                if (googleEvent.attendees) {
                  googleEvent.attendees.forEach((attendee) => {
                    if (attendee.email && !allRecipients.includes(attendee.email)) {
                      allRecipients.push(attendee.email);
                    }
                  });
                }
              }
            } catch (googleError: any) {
              console.error('Erreur lors de la récupération des invités:', googleError);
              // On continue avec au moins le contact
            }
          }

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
            `${task.contact?.firstName || ''} ${task.contact?.lastName || ''}`.trim() ||
            'Cher client';
          const organizerName = organizer?.name || session.user.name || 'Organisateur';

          const oldScheduledAt = existingTask.scheduledAt.toISOString();
          const newScheduledAt = task.scheduledAt.toISOString();
          const oldDuration = existingTask.durationMinutes ?? 30;
          const newDuration = task.durationMinutes ?? 30;

          // Générer le contenu HTML de l'email avec le composant React
          const emailComponent = React.createElement(MeetUpdateEmailTemplate, {
            contactName,
            title: task.title || 'Rendez-vous',
            oldScheduledAt,
            newScheduledAt,
            oldDuration,
            newDuration,
            hasDateChanged,
            hasDurationChanged,
            meetLink: task.googleMeetLink || undefined,
            description: task.description,
            organizerName,
            signature: smtpConfig.signature || undefined,
          });

          const emailHtml = await render(emailComponent);
          const emailText = htmlToText(emailHtml);

          // Envoyer un email individuel à chaque destinataire pour préserver la confidentialité
          if (allRecipients.length > 0) {
            for (const recipientEmail of allRecipients) {
              try {
                await transporter.sendMail({
                  from: smtpConfig.fromName
                    ? `"${smtpConfig.fromName}" <${smtpConfig.fromEmail}>`
                    : smtpConfig.fromEmail,
                  to: recipientEmail,
                  subject: `Modification de rendez-vous : ${task.title || 'Rendez-vous'}`,
                  text: emailText,
                  html: emailHtml,
                });
              } catch (individualEmailError: any) {
                // Logger l'erreur mais continuer avec les autres destinataires
                console.error(
                  `Erreur lors de l'envoi de l'email à ${recipientEmail}:`,
                  individualEmailError,
                );
              }
            }
          }
        }
      } catch (emailError: any) {
        // Ne pas faire échouer la mise à jour si l'email échoue
        console.error("Erreur lors de l'envoi de l'email de modification:", emailError);
      }
    }

    return NextResponse.json(task);
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour de la tâche:', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/tasks/[id] - Supprimer une tâche
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { notifyContact } = body;

    // Vérifier que la tâche existe
    const task = await prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      return NextResponse.json({ error: 'Tâche non trouvée' }, { status: 404 });
    }

    // Vérifier les permissions
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (task.assignedUserId !== session.user.id && user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Récupérer les informations du contact avant suppression pour l'email
    const taskWithContact = await prisma.task.findUnique({
      where: { id },
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
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

    // Récupérer les invités depuis Google Calendar AVANT suppression pour l'email
    let allRecipients: string[] = [];
    if (task.googleEventId && taskWithContact?.contact?.email) {
      allRecipients.push(taskWithContact.contact.email!);

      try {
        const googleAccount = await prisma.userGoogleAccount.findUnique({
          where: { userId: session.user.id },
        });

        if (googleAccount) {
          const accessToken = await getValidAccessToken(
            googleAccount.accessToken,
            googleAccount.refreshToken,
            googleAccount.tokenExpiresAt,
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

          // Récupérer les invités AVANT de supprimer l'événement
          const googleEvent = await getGoogleCalendarEvent(accessToken, task.googleEventId);
          if (googleEvent.attendees) {
            googleEvent.attendees.forEach((attendee) => {
              if (attendee.email && !allRecipients.includes(attendee.email)) {
                allRecipients.push(attendee.email);
              }
            });
          }

          // Supprimer l'événement Google Calendar
          await deleteGoogleCalendarEvent(accessToken, task.googleEventId);
        }
      } catch (googleError: any) {
        console.error("Erreur lors de la suppression de l'événement Google Calendar:", googleError);
        // On continue quand même la suppression de la tâche
      }
    }

    // Créer une interaction pour l'annulation si c'est un Google Meet ou un RDV
    if (task.contactId && (task.type === 'VIDEO_CONFERENCE' || task.type === 'MEETING')) {
      try {
        console.log('Création interaction annulation pour task:', {
          contactId: task.contactId,
          taskId: task.id,
          type: task.type,
          title: task.title,
        });
        await logAppointmentCancelled(
          task.contactId,
          task.id,
          task.scheduledAt,
          task.title,
          session.user.id,
          task.type === 'VIDEO_CONFERENCE',
        );
        console.log("Interaction d'annulation créée avec succès");
      } catch (interactionError: any) {
        console.error(
          "Erreur lors de la création de l'interaction d'annulation:",
          interactionError,
        );
        // On continue même si l'interaction échoue
      }
    } else {
      console.log("Pas de création d'interaction - conditions non remplies:", {
        contactId: task.contactId,
        type: task.type,
      });
    }

    // Supprimer la tâche
    await prisma.task.delete({
      where: { id },
    });

    // Déterminer si on doit envoyer un email d'annulation
    const shouldNotifyForGoogleMeet =
      task.googleEventId && allRecipients.length > 0 && task.googleMeetLink;

    // Pour les rendez-vous physiques, envoyer un email si :
    // - Le contact avait été prévenu initialement (task.notifyContact === true)
    // - OU l'utilisateur demande explicitement de prévenir (notifyContact === true)
    const shouldNotifyForPhysicalMeeting =
      task.type === 'MEETING' &&
      !task.googleEventId &&
      taskWithContact?.contact?.email &&
      (task.notifyContact === true || notifyContact === true);

    // Envoyer un email d'annulation si nécessaire
    if (shouldNotifyForGoogleMeet || shouldNotifyForPhysicalMeeting) {
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
            `${taskWithContact?.contact?.firstName || ''} ${taskWithContact?.contact?.lastName || ''}`.trim() ||
            'Cher client';
          const organizerName = organizer?.name || session.user.name || 'Organisateur';

          // Générer le contenu HTML de l'email avec le composant React
          const emailComponent = React.createElement(MeetCancellationEmailTemplate, {
            contactName,
            title: task.title || 'Rendez-vous',
            scheduledAt: task.scheduledAt.toISOString(),
            durationMinutes: task.googleMeetLink ? (task.durationMinutes ?? 30) : undefined,
            meetLink: task.googleMeetLink || undefined,
            description: task.description,
            organizerName,
            signature: smtpConfig.signature || undefined,
          });

          const emailHtml = await render(emailComponent);
          const emailText = htmlToText(emailHtml);

          // Envoyer un email individuel à chaque destinataire pour préserver la confidentialité
          if (allRecipients.length > 0) {
            for (const recipientEmail of allRecipients) {
              try {
                await transporter.sendMail({
                  from: smtpConfig.fromName
                    ? `"${smtpConfig.fromName}" <${smtpConfig.fromEmail}>`
                    : smtpConfig.fromEmail,
                  to: recipientEmail,
                  subject: `Annulation de rendez-vous : ${task.title || 'Rendez-vous'}`,
                  text: emailText,
                  html: emailHtml,
                });
              } catch (individualEmailError: any) {
                // Logger l'erreur mais continuer avec les autres destinataires
                console.error(
                  `Erreur lors de l'envoi de l'email à ${recipientEmail}:`,
                  individualEmailError,
                );
              }
            }
          }
        }
      } catch (emailError: any) {
        // Ne pas faire échouer la suppression si l'email échoue
        console.error("Erreur lors de l'envoi de l'email d'annulation:", emailError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erreur lors de la suppression de la tâche:', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}
