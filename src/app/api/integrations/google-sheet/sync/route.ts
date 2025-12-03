import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getValidAccessToken } from '@/lib/google-calendar';

function columnToIndex(column: string | null | undefined): number | null {
  if (!column) return null;
  const col = column.trim().toUpperCase();
  if (!col) return null;

  // Support simple colonnes A, B, C... et éventuellement AA, AB...
  let index = 0;
  for (let i = 0; i < col.length; i++) {
    const charCode = col.charCodeAt(i);
    if (charCode < 65 || charCode > 90) {
      return null;
    }
    index = index * 26 + (charCode - 64);
  }
  return index - 1; // 0-based
}

// POST /api/integrations/google-sheet/sync - Synchroniser les contacts depuis Google Sheets
export async function POST(request: NextRequest) {
  try {
    const client = prisma as any;

    const config = await client.googleSheetSyncConfig.findFirst({
      include: {
        ownerUser: true,
      },
    });

    if (!config || !config.active) {
      return NextResponse.json(
        { error: "Aucune configuration Google Sheets active n'a été trouvée." },
        { status: 400 },
      );
    }

    // Récupérer le compte Google de l'utilisateur propriétaire pour appeler l'API Sheets
    const googleAccount = await client.userGoogleAccount.findUnique({
      where: { userId: config.ownerUserId },
    });

    if (!googleAccount) {
      return NextResponse.json(
        {
          error:
            'Aucun compte Google connecté pour l’utilisateur propriétaire de la configuration. Veuillez connecter votre compte Google dans les paramètres.',
        },
        { status: 400 },
      );
    }

    const accessToken = await getValidAccessToken(
      googleAccount.accessToken,
      googleAccount.refreshToken,
      googleAccount.tokenExpiresAt,
    );

    // Mettre à jour le token si nécessaire
    if (accessToken !== googleAccount.accessToken) {
      const tokenExpiresAt = new Date();
      tokenExpiresAt.setSeconds(tokenExpiresAt.getSeconds() + 3600);
      await client.userGoogleAccount.update({
        where: { userId: config.ownerUserId },
        data: {
          accessToken,
          tokenExpiresAt,
        },
      });
    }

    const range = encodeURIComponent(config.sheetName);
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${range}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erreur lors de la lecture du Google Sheet:', errorText);
      return NextResponse.json(
        { error: "Impossible de lire les données depuis Google Sheets." },
        { status: 500 },
      );
    }

    const data = await response.json();
    const values: string[][] = data.values || [];

    if (!values.length) {
      return NextResponse.json({
        imported: 0,
        updated: 0,
        skipped: 0,
        message: 'Aucune donnée trouvée dans le Google Sheet.',
      });
    }

    const headerRowIndex = config.headerRow - 1; // 0-based
    const startRowIndex = Math.max(headerRowIndex + 1, (config.lastSyncedRow || headerRowIndex) + 1);

    const phoneIdx = columnToIndex(config.phoneColumn);
    if (phoneIdx === null) {
      return NextResponse.json(
        { error: 'La colonne téléphone configurée est invalide.' },
        { status: 400 },
      );
    }

    const firstNameIdx = columnToIndex(config.firstNameColumn);
    const lastNameIdx = columnToIndex(config.lastNameColumn);
    const emailIdx = columnToIndex(config.emailColumn);
    const cityIdx = columnToIndex(config.cityColumn);
    const postalCodeIdx = columnToIndex(config.postalCodeColumn);
    const originIdx = columnToIndex(config.originColumn);

    let imported = 0;
    let updated = 0;
    let skipped = 0;
    let maxProcessedRow = config.lastSyncedRow || headerRowIndex;

    for (let rowIndex = startRowIndex; rowIndex < values.length; rowIndex++) {
      const row = values[rowIndex];
      if (!row) continue;

      const phone = row[phoneIdx]?.trim();
      if (!phone) {
        skipped++;
        continue;
      }

      const firstName = firstNameIdx !== null ? row[firstNameIdx]?.trim() || undefined : undefined;
      const lastName = lastNameIdx !== null ? row[lastNameIdx]?.trim() || undefined : undefined;
      const email = emailIdx !== null ? row[emailIdx]?.trim() || undefined : undefined;
      const city = cityIdx !== null ? row[cityIdx]?.trim() || undefined : undefined;
      const postalCode =
        postalCodeIdx !== null ? row[postalCodeIdx]?.trim() || undefined : undefined;
      const origin =
        originIdx !== null ? row[originIdx]?.trim() || 'Google Sheets' : 'Google Sheets';

      // Chercher un contact existant
      let contact =
        (email &&
          (await client.contact.findFirst({
            where: {
              OR: [{ email: email.toLowerCase() }, { phone }],
            },
          }))) ||
        (await client.contact.findFirst({
          where: { phone },
        }));

      if (!contact) {
        contact = await client.contact.create({
          data: {
            firstName: firstName || null,
            lastName: lastName || null,
            email: email ? email.toLowerCase() : null,
            phone,
            city: city || null,
            postalCode: postalCode || null,
            origin,
            statusId: config.defaultStatusId || null,
            assignedUserId: config.defaultAssignedUserId,
            createdById: config.defaultAssignedUserId,
          },
        });
        imported++;
      } else {
        await client.contact.update({
          where: { id: contact.id },
          data: {
            firstName: contact.firstName || firstName || null,
            lastName: contact.lastName || lastName || null,
            email: contact.email || (email ? email.toLowerCase() : null),
            city: contact.city || city || null,
            postalCode: contact.postalCode || postalCode || null,
            origin: contact.origin || origin,
            statusId: contact.statusId || config.defaultStatusId || null,
            assignedUserId: contact.assignedUserId || config.defaultAssignedUserId,
          },
        });
        updated++;
      }

      // Créer une interaction de log uniquement pour les nouveaux contacts
      await client.interaction.create({
        data: {
          contactId: contact.id,
          type: 'NOTE',
          title: 'Contact importé depuis Google Sheets',
          content: 'Ce contact a été importé automatiquement depuis Google Sheets.',
          userId: config.defaultAssignedUserId,
          date: new Date(),
        },
      });

      if (rowIndex > maxProcessedRow) {
        maxProcessedRow = rowIndex;
      }
    }

    if (maxProcessedRow > (config.lastSyncedRow || headerRowIndex)) {
      await client.googleSheetSyncConfig.update({
        where: { id: config.id },
        data: {
          lastSyncedRow: maxProcessedRow,
        },
      });
    }

    return NextResponse.json({
      imported,
      updated,
      skipped,
    });
  } catch (error: any) {
    console.error('Erreur lors de la synchronisation Google Sheets:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}


