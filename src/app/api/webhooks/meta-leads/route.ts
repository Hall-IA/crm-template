import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/encryption';
import { handleContactDuplicate } from '@/lib/contact-duplicate';

interface MetaLeadChange {
  field: string;
  value: {
    leadgen_id: string;
    form_id: string;
    created_time: number;
    page_id: string;
  };
}

// GET /api/webhooks/meta-leads - Vérification du webhook Meta (subscription)
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const mode = url.searchParams.get('hub.mode');
    const verifyToken = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    if (mode !== 'subscribe' || !verifyToken || !challenge) {
      return NextResponse.json({ error: 'Requête invalide' }, { status: 400 });
    }

    // Vérifier toutes les configurations actives pour trouver celle qui correspond au verifyToken
    const configs = await prisma.metaLeadConfig.findMany({
      where: { active: true },
    });

    const config = configs.find((c) => c.verifyToken === verifyToken);

    if (!config) {
      return NextResponse.json({ error: 'Token de vérification invalide' }, { status: 403 });
    }

    return new Response(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  } catch (error: any) {
    console.error('Erreur lors de la vérification du webhook Meta Lead Ads:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/webhooks/meta-leads - Réception des leads Meta
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.object !== 'page' || !Array.isArray(body.entry)) {
      return NextResponse.json({ received: true });
    }

    // Récupérer toutes les configurations actives
    const configs = await prisma.metaLeadConfig.findMany({
      where: { active: true },
    });

    if (!configs || configs.length === 0) {
      console.warn('Webhook Meta Lead Ads reçu mais aucune configuration active trouvée.');
      return NextResponse.json({ received: true });
    }

    for (const entry of body.entry) {
      if (!Array.isArray(entry.changes)) continue;

      for (const change of entry.changes as MetaLeadChange[]) {
        if (change.field !== 'leadgen') continue;

        const { leadgen_id: leadId, page_id: pageId } = change.value;

        // Trouver la configuration correspondante à la page
        const config = configs.find((c) => c.pageId === pageId);

        if (!config) {
          console.warn(
            `Lead Meta reçu pour la page ${pageId} mais aucune configuration active trouvée pour cette page.`,
          );
          continue;
        }

        try {
          const accessToken = decrypt(config.accessToken);

          // Récupérer les données du lead depuis l'API Graph
          const leadResponse = await fetch(
            `https://graph.facebook.com/v18.0/${leadId}?access_token=${encodeURIComponent(
              accessToken,
            )}`,
          );

          if (!leadResponse.ok) {
            const errorText = await leadResponse.text();
            console.error('Erreur lors de la récupération du lead Meta:', errorText);
            continue;
          }

          const leadData = await leadResponse.json();
          const fieldData: Array<{ name: string; values: string[] }> = leadData.field_data || [];

          const getField = (name: string): string | undefined => {
            const field = fieldData.find((f) => f.name === name);
            return field?.values?.[0];
          };

          let firstName = getField('first_name') || undefined;
          let lastName = getField('last_name') || undefined;
          const fullName = getField('full_name') || getField('name');
          const email = getField('email');
          const phone = getField('phone_number') || getField('phone');

          if ((!firstName || !lastName) && fullName) {
            const parts = fullName.split(' ');
            firstName = firstName || parts.slice(0, -1).join(' ') || parts[0];
            lastName = lastName || parts.slice(-1).join(' ');
          }

          // Le téléphone est obligatoire pour un contact dans ce CRM
          if (!phone) {
            console.warn(
              'Lead Meta reçu sans numéro de téléphone, impossible de créer le contact. Lead ID:',
              leadId,
            );
            continue;
          }

          // Déterminer l'utilisateur pour createdById (nécessaire pour créer le contact)
          let createdById = config.defaultAssignedUserId || null;
          if (!createdById) {
            const adminUser = await prisma.user.findFirst({
              where: { role: 'ADMIN' },
              orderBy: { createdAt: 'asc' },
            });
            if (adminUser) {
              createdById = adminUser.id;
            }
          }

          if (!createdById) {
            console.warn(
              'Lead Meta reçu mais aucun utilisateur pour créer le contact trouvé. Lead ID:',
              leadId,
            );
            continue;
          }

          // Déterminer l'assignation selon le rôle de l'utilisateur par défaut
          let assignedCommercialId: string | null = null;
          let assignedTeleproId: string | null = null;

          if (config.defaultAssignedUserId) {
            const defaultUser = await prisma.user.findUnique({
              where: { id: config.defaultAssignedUserId },
              select: { role: true },
            });

            if (defaultUser) {
              if (defaultUser.role === 'COMMERCIAL' || defaultUser.role === 'ADMIN' || defaultUser.role === 'MANAGER') {
                assignedCommercialId = config.defaultAssignedUserId;
              } else if (defaultUser.role === 'TELEPRO') {
                assignedTeleproId = config.defaultAssignedUserId;
              }
              // Sinon, on ne assigne pas (null pour les deux)
            }
          }

          // Vérifier si c'est un doublon (nom, prénom ET email)
          const duplicateContactId = await handleContactDuplicate(
            firstName,
            lastName,
            email,
            `Meta Lead Ads - ${config.name}`,
            createdById
          );

          let contact;
          if (duplicateContactId) {
            // C'est un doublon, récupérer le contact existant
            contact = await prisma.contact.findUnique({
              where: { id: duplicateContactId },
            });
          } else {
            // Vérifier si un contact existe déjà (par téléphone uniquement)
            contact = await prisma.contact.findFirst({
              where: { phone },
            });

            if (!contact) {
              contact = await prisma.contact.create({
                data: {
                  firstName: firstName || null,
                  lastName: lastName || null,
                  email: email ? email.toLowerCase() : null,
                  phone,
                  origin: `Meta Lead Ads - ${config.name}`,
                  statusId: config.defaultStatusId || null,
                  assignedCommercialId: assignedCommercialId,
                  assignedTeleproId: assignedTeleproId,
                  createdById: createdById,
                },
              });
            } else {
              // Mettre à jour quelques infos si manquantes
              await prisma.contact.update({
                where: { id: contact.id },
                data: {
                  firstName: contact.firstName || firstName || null,
                  lastName: contact.lastName || lastName || null,
                  email: contact.email || (email ? email.toLowerCase() : null),
                  origin: contact.origin || `Meta Lead Ads - ${config.name}`,
                  statusId: contact.statusId || config.defaultStatusId || null,
                  // Ne pas écraser les assignations existantes
                  assignedCommercialId: contact.assignedCommercialId || assignedCommercialId,
                  assignedTeleproId: contact.assignedTeleproId || assignedTeleproId,
                },
              });
            }
          }

          // Créer une interaction "Lead Meta"
          if (contact) {
            await prisma.interaction.create({
              data: {
                contactId: contact.id,
                type: 'NOTE',
                title: `Lead Meta Lead Ads - ${config.name}`,
                content: `Lead importé automatiquement depuis Meta Lead Ads (${config.name}, formulaire: ${
                  change.value.form_id
                }).`,
                userId: createdById,
                date: new Date(change.value.created_time * 1000),
              },
            });
          }
        } catch (err: any) {
          console.error('Erreur lors du traitement du lead Meta:', err);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Erreur lors du traitement du webhook Meta Lead Ads:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}


