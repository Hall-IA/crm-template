import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/roles';
import { encrypt } from '@/lib/encryption';

// PUT /api/settings/meta-leads/[id] - Mettre à jour une configuration (admin uniquement)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin(request.headers);

    const { id } = await params;
    const body = await request.json();
    const {
      name,
      pageId,
      accessToken,
      verifyToken,
      active,
      defaultStatusId,
      defaultAssignedUserId,
    } = body;

    const existingConfig = await prisma.metaLeadConfig.findUnique({
      where: { id },
    });

    if (!existingConfig) {
      return NextResponse.json({ error: 'Configuration non trouvée' }, { status: 404 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (pageId !== undefined) updateData.pageId = pageId;
    if (accessToken !== undefined) {
      try {
        updateData.accessToken = encrypt(accessToken);
      } catch (encryptError: any) {
        console.error("Erreur lors du chiffrement du jeton d'accès Meta:", encryptError);
        return NextResponse.json(
          { error: `Erreur de chiffrement: ${encryptError.message}` },
          { status: 500 },
        );
      }
    }
    if (verifyToken !== undefined) updateData.verifyToken = verifyToken;
    if (active !== undefined) updateData.active = !!active;
    if (defaultStatusId !== undefined) updateData.defaultStatusId = defaultStatusId || null;
    if (defaultAssignedUserId !== undefined)
      updateData.defaultAssignedUserId = defaultAssignedUserId || null;

    const config = await prisma.metaLeadConfig.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      config: {
        id: config.id,
        name: config.name,
        pageId: config.pageId,
        verifyToken: config.verifyToken,
        active: config.active,
        defaultStatusId: config.defaultStatusId,
        defaultAssignedUserId: config.defaultAssignedUserId,
      },
      message: 'Configuration Meta Lead Ads mise à jour avec succès.',
    });
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour de la configuration Meta Lead Ads:', error);

    if (error.message === 'Non authentifié') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (error.message === 'Permissions insuffisantes') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/settings/meta-leads/[id] - Supprimer une configuration (admin uniquement)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin(request.headers);

    const { id } = await params;

    const existingConfig = await prisma.metaLeadConfig.findUnique({
      where: { id },
    });

    if (!existingConfig) {
      return NextResponse.json({ error: 'Configuration non trouvée' }, { status: 404 });
    }

    await prisma.metaLeadConfig.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Configuration Meta Lead Ads supprimée avec succès.',
    });
  } catch (error: any) {
    console.error('Erreur lors de la suppression de la configuration Meta Lead Ads:', error);

    if (error.message === 'Non authentifié') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (error.message === 'Permissions insuffisantes') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}

