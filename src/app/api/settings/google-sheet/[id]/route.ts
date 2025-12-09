import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/roles';

function extractSpreadsheetId(sheetUrlOrId: string): string {
  if (!sheetUrlOrId) return sheetUrlOrId;

  if (!sheetUrlOrId.includes('https://')) {
    return sheetUrlOrId;
  }

  const match = sheetUrlOrId.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }

  return sheetUrlOrId;
}

// PUT /api/settings/google-sheet/[id] - Mettre à jour une configuration (admin uniquement)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request.headers);

    const { id } = await params;
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
      active,
      defaultStatusId,
      defaultAssignedUserId,
    } = body;

    const client = prisma as any;

    const existingConfig = await client.googleSheetSyncConfig.findUnique({
      where: { id },
    });

    if (!existingConfig) {
      return NextResponse.json({ error: 'Configuration non trouvée' }, { status: 404 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (sheetUrl !== undefined) updateData.spreadsheetId = extractSpreadsheetId(sheetUrl);
    if (sheetName !== undefined) updateData.sheetName = sheetName;
    if (headerRow !== undefined) {
      const headerRowNumber = Number(headerRow);
      if (!headerRowNumber || headerRowNumber < 1) {
        return NextResponse.json(
          { error: 'La ligne des en-têtes doit être un nombre positif (ex: 1, 2...).' },
          { status: 400 },
        );
      }
      updateData.headerRow = headerRowNumber;
    }
    if (phoneColumn !== undefined) updateData.phoneColumn = phoneColumn;
    if (firstNameColumn !== undefined) updateData.firstNameColumn = firstNameColumn || null;
    if (lastNameColumn !== undefined) updateData.lastNameColumn = lastNameColumn || null;
    if (emailColumn !== undefined) updateData.emailColumn = emailColumn || null;
    if (cityColumn !== undefined) updateData.cityColumn = cityColumn || null;
    if (postalCodeColumn !== undefined) updateData.postalCodeColumn = postalCodeColumn || null;
    if (originColumn !== undefined) updateData.originColumn = originColumn || null;
    if (active !== undefined) updateData.active = !!active;
    if (defaultStatusId !== undefined) updateData.defaultStatusId = defaultStatusId || null;
    if (defaultAssignedUserId !== undefined) {
      if (!defaultAssignedUserId) {
        return NextResponse.json(
          { error: "L'utilisateur assigné par défaut est obligatoire." },
          { status: 400 },
        );
      }
      updateData.defaultAssignedUserId = defaultAssignedUserId;
    }

    const config = await client.googleSheetSyncConfig.update({
      where: { id },
      data: updateData,
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
      message: 'Configuration Google Sheets mise à jour avec succès.',
    });
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour de la configuration Google Sheets:', error);

    if (error.message === 'Non authentifié') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (error.message === 'Permissions insuffisantes') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/settings/google-sheet/[id] - Supprimer une configuration (admin uniquement)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin(request.headers);

    const { id } = await params;
    const client = prisma as any;

    const existingConfig = await client.googleSheetSyncConfig.findUnique({
      where: { id },
    });

    if (!existingConfig) {
      return NextResponse.json({ error: 'Configuration non trouvée' }, { status: 404 });
    }

    await client.googleSheetSyncConfig.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Configuration Google Sheets supprimée avec succès.',
    });
  } catch (error: any) {
    console.error('Erreur lors de la suppression de la configuration Google Sheets:', error);

    if (error.message === 'Non authentifié') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (error.message === 'Permissions insuffisantes') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}
