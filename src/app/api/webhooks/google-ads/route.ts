import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    const config = await client.googleAdsLeadConfig.findFirst({
      where: { active: true },
    });

    if (!config) {
      console.warn(
        'Webhook Google Ads reçu mais aucune configuration active GoogleAdsLeadConfig trouvée.',
      );
      return NextResponse.json({ received: true });
    }

    // Vérifier la clé partagée
    if (notification.googleKey !== config.webhookKey) {
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

    // Déterminer l'utilisateur assigné par défaut
    let assignedUserId = config.defaultAssignedUserId || null;
    if (!assignedUserId) {
      const adminUser = await client.user.findFirst({
        where: { role: 'ADMIN' },
        orderBy: { createdAt: 'asc' },
      });
      if (adminUser) {
        assignedUserId = adminUser.id;
      }
    }

    if (!assignedUserId) {
      console.warn(
        'Lead Google Ads reçu mais aucun utilisateur assigné par défaut trouvé. Notification:',
        notification,
      );
      return NextResponse.json({ received: true });
    }

    // Vérifier si un contact existe déjà
    let contact =
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
          origin: 'Google Ads',
          statusId: config.defaultStatusId || null,
          assignedUserId,
          createdById: assignedUserId,
        },
      });
    } else {
      await client.contact.update({
        where: { id: contact.id },
        data: {
          firstName: contact.firstName || firstName || null,
          lastName: contact.lastName || lastName || null,
          email: contact.email || (email ? email.toLowerCase() : null),
          origin: contact.origin || 'Google Ads',
          statusId: contact.statusId || config.defaultStatusId || null,
          assignedUserId: contact.assignedUserId || assignedUserId,
        },
      });
    }

    // Créer une interaction "Lead Google Ads"
    await client.interaction.create({
      data: {
        contactId: contact.id,
        type: 'NOTE',
        title: 'Lead Google Ads',
        content: `Lead importé automatiquement depuis Google Ads (client: ${
          notification.customerId || 'inconnu'
        }).`,
        userId: assignedUserId,
        date: new Date(),
      },
    });

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Erreur lors du traitement du webhook Google Ads Lead Forms:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}


