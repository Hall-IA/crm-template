import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/roles';

function extractSpreadsheetId(sheetUrlOrId: string): string {
  if (!sheetUrlOrId) return sheetUrlOrId;

  // Si c'est déjà un ID simple, on le renvoie
  if (!sheetUrlOrId.includes('https://')) {
    return sheetUrlOrId;
  }

  const match = sheetUrlOrId.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }

  return sheetUrlOrId;
}

// GET /api/settings/google-sheet - Récupérer toutes les configurations Google Sheets (admin uniquement)
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request.headers);

    const client = prisma as any;

    const configs = await client.googleSheetSyncConfig.findMany({
      include: {
        defaultStatus: true,
        defaultAssignedUser: {
          select: { id: true, name: true, email: true },
        },
        ownerUser: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(
      configs.map((config: any) => ({
        id: config.id,
        name: config.name,
        spreadsheetId: config.spreadsheetId,
        sheetName: config.sheetName,
        headerRow: config.headerRow,
        phoneColumn: config.phoneColumn,
        firstNameColumn: config.firstNameColumn,
        lastNameColumn: config.lastNameColumn,
        emailColumn: config.emailColumn,
        cityColumn: config.cityColumn,
        postalCodeColumn: config.postalCodeColumn,
        originColumn: config.originColumn,
        active: config.active,
        lastSyncedRow: config.lastSyncedRow,
        defaultStatusId: config.defaultStatusId,
        defaultAssignedUserId: config.defaultAssignedUserId,
        ownerUser: config.ownerUser,
        defaultStatus: config.defaultStatus
          ? {
              id: config.defaultStatus.id,
              name: config.defaultStatus.name,
              color: config.defaultStatus.color,
            }
          : null,
        defaultAssignedUser: config.defaultAssignedUser || null,
      })),
    );
  } catch (error: any) {
    console.error('Erreur lors de la récupération des configurations Google Sheets:', error);

    if (error.message === 'Non authentifié') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (error.message === 'Permissions insuffisantes') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/settings/google-sheet - Créer une nouvelle configuration (admin uniquement)
export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin(request.headers);

    const body = await request.json();
    const {
      name,
      sheetUrl,
      sheetName,
      headerRow,
      phoneColumn,
      firstNameColumn,
      lastNameColumn,
      emailColumn,
      cityColumn,
      postalCodeColumn,
      originColumn,
      active = true,
      defaultStatusId,
      defaultAssignedUserId,
    } = body;

    if (!name || !sheetUrl || !sheetName || !headerRow || !phoneColumn) {
      return NextResponse.json(
        {
          error:
            'Les champs nom, lien du Google Sheet, nom de l’onglet, ligne des en-têtes et colonne téléphone sont obligatoires.',
        },
        { status: 400 },
      );
    }

    if (!defaultAssignedUserId) {
      return NextResponse.json(
        { error: "L'utilisateur assigné par défaut est obligatoire." },
        { status: 400 },
      );
    }

    const spreadsheetId = extractSpreadsheetId(sheetUrl);
    const headerRowNumber = Number(headerRow);

    if (!headerRowNumber || headerRowNumber < 1) {
      return NextResponse.json(
        { error: 'La ligne des en-têtes doit être un nombre positif (ex: 1, 2...).' },
        { status: 400 },
      );
    }

    const client = prisma as any;

    const config = await client.googleSheetSyncConfig.create({
      data: {
        name,
        ownerUserId: session.user.id,
        spreadsheetId,
        sheetName,
        headerRow: headerRowNumber,
        phoneColumn,
        firstNameColumn: firstNameColumn || null,
        lastNameColumn: lastNameColumn || null,
        emailColumn: emailColumn || null,
        cityColumn: cityColumn || null,
        postalCodeColumn: postalCodeColumn || null,
        originColumn: originColumn || null,
        active: !!active,
        defaultStatusId: defaultStatusId || null,
        defaultAssignedUserId,
      },
    });

    return NextResponse.json({
      success: true,
      config: {
        id: config.id,
        name: config.name,
        spreadsheetId: config.spreadsheetId,
        sheetName: config.sheetName,
        headerRow: config.headerRow,
        phoneColumn: config.phoneColumn,
        firstNameColumn: config.firstNameColumn,
        lastNameColumn: config.lastNameColumn,
        emailColumn: config.emailColumn,
        cityColumn: config.cityColumn,
        postalCodeColumn: config.postalCodeColumn,
        originColumn: config.originColumn,
        active: config.active,
        defaultStatusId: config.defaultStatusId,
        defaultAssignedUserId: config.defaultAssignedUserId,
      },
      message: 'Configuration Google Sheets créée avec succès.',
    });
  } catch (error: any) {
    console.error('Erreur lors de la création de la configuration Google Sheets:', error);

    if (error.message === 'Non authentifié') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (error.message === 'Permissions insuffisantes') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}
