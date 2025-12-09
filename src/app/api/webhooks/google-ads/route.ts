import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleContactDuplicate } from '@/lib/contact-duplicate';

interface GoogleAdsUserColumnData {
  columnName: string;
  stringValue?: string;
}

interface GoogleAdsLeadNotification {
  googleKey: string;
  customerId?: string;
  leadResourceName?: string;
  userColumnData?: GoogleAdsUserColumnData[];
}

// POST /api/webhooks/google-ads - Réception des leads Google Ads (lead form extensions)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const notification: GoogleAdsLeadNotification | undefined = body?.leadNotification;

    if (!notification || !notification.googleKey) {
      console.warn('Webhook Google Ads reçu avec un format inattendu:', body);
      return NextResponse.json({ received: true });
    }

    const client = prisma as any;

    // Récupérer toutes les configurations actives
    const configs = await client.googleAdsLeadConfig.findMany({
      where: { active: true },
    });

    if (!configs || configs.length === 0) {
      console.warn(
        'Webhook Google Ads reçu mais aucune configuration active GoogleAdsLeadConfig trouvée.',
      );
      return NextResponse.json({ received: true });
    }

    // Trouver la configuration correspondante à la clé
    const config = configs.find((c: any) => c.webhookKey === notification.googleKey);

    if (!config) {
      console.warn('Clé Google Ads invalide reçue sur le webhook.');
      return NextResponse.json({ error: 'Clé invalide' }, { status: 403 });
    }

    const userColumns = notification.userColumnData || [];

    const getField = (name: string): string | undefined => {
      const field = userColumns.find((f) => f.columnName === name);
      return field?.stringValue;
    };

    const fullName = getField('FULL_NAME') || getField('NAME');
    let firstName = getField('FIRST_NAME');
    let lastName = getField('LAST_NAME');
    const email = getField('EMAIL');
    const phone = getField('PHONE_NUMBER') || getField('PHONE');

    if ((!firstName || !lastName) && fullName) {
      const parts = fullName.split(' ');
      firstName = firstName || parts.slice(0, -1).join(' ') || parts[0];
      lastName = lastName || parts.slice(-1).join(' ');
    }

    if (!phone && !email) {
      console.warn(
        'Lead Google Ads reçu sans téléphone ni email, impossible de créer un contact. Notification:',
        notification,
      );
      return NextResponse.json({ received: true });
    }

    // Déterminer l'utilisateur pour createdById (nécessaire pour créer le contact)
    let createdById = config.defaultAssignedUserId || null;
    if (!createdById) {
      const adminUser = await client.user.findFirst({
        where: { role: 'ADMIN' },
        orderBy: { createdAt: 'asc' },
      });
      if (adminUser) {
        createdById = adminUser.id;
      }
    }

    if (!createdById) {
      console.warn(
        'Lead Google Ads reçu mais aucun utilisateur pour créer le contact trouvé. Notification:',
        notification,
      );
      return NextResponse.json({ received: true });
    }

    // Déterminer l'assignation selon le rôle de l'utilisateur par défaut
    let assignedCommercialId: string | null = null;
    let assignedTeleproId: string | null = null;

    if (config.defaultAssignedUserId) {
      const defaultUser = await client.user.findUnique({
        where: { id: config.defaultAssignedUserId },
        select: { role: true },
      });

      if (defaultUser) {
        if (
          defaultUser.role === 'COMMERCIAL' ||
          defaultUser.role === 'ADMIN' ||
          defaultUser.role === 'MANAGER'
        ) {
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
      `Google Ads - ${config.name}`,
      createdById,
    );

    let contact;
    if (duplicateContactId) {
      // C'est un doublon, récupérer le contact existant
      contact = await client.contact.findUnique({
        where: { id: duplicateContactId },
      });
    } else {
      // Vérifier si un contact existe déjà (par téléphone uniquement)
      contact =
        (email &&
          (await client.contact.findFirst({
            where: {
              OR: [{ email: email.toLowerCase() }, phone ? { phone } : undefined].filter(
                Boolean,
              ) as any,
            },
          }))) ||
        (phone &&
          (await client.contact.findFirst({
            where: { phone },
          })));

      if (!contact) {
        contact = await client.contact.create({
          data: {
            firstName: firstName || null,
            lastName: lastName || null,
            email: email ? email.toLowerCase() : null,
            phone: phone || '',
            origin: `Google Ads - ${config.name}`,
            statusId: config.defaultStatusId || null,
            assignedCommercialId: assignedCommercialId,
            assignedTeleproId: assignedTeleproId,
            createdById: createdById,
          },
        });
      } else {
        await client.contact.update({
          where: { id: contact.id },
          data: {
            firstName: contact.firstName || firstName || null,
            lastName: contact.lastName || lastName || null,
            email: contact.email || (email ? email.toLowerCase() : null),
            origin: contact.origin || `Google Ads - ${config.name}`,
            statusId: contact.statusId || config.defaultStatusId || null,
            // Ne pas écraser les assignations existantes
            assignedCommercialId: contact.assignedCommercialId || assignedCommercialId,
            assignedTeleproId: contact.assignedTeleproId || assignedTeleproId,
          },
        });
      }
    }

    // Créer une interaction "Lead Google Ads"
    await client.interaction.create({
      data: {
        contactId: contact.id,
        type: 'NOTE',
        title: `Lead Google Ads - ${config.name}`,
        content: `Lead importé automatiquement depuis Google Ads (${config.name}, client: ${
          notification.customerId || 'inconnu'
        }).`,
        userId: createdById,
        date: new Date(),
      },
    });

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Erreur lors du traitement du webhook Google Ads Lead Forms:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
