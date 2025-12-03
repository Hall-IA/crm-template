import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/roles';

// PUT /api/settings/google-ads/[id] - Mettre à jour une configuration (admin uniquement)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin(request.headers);

    const { id } = await params;
    const body = await request.json();
    const { name, webhookKey, active, defaultStatusId, defaultAssignedUserId } = body;

    const client = prisma as any;

    const existingConfig = await client.googleAdsLeadConfig.findUnique({
      where: { id },
    });

    if (!existingConfig) {
      return NextResponse.json({ error: 'Configuration non trouvée' }, { status: 404 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (webhookKey !== undefined) updateData.webhookKey = webhookKey;
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

    const config = await client.googleAdsLeadConfig.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      config: {
        id: config.id,
        name: config.name,
        webhookKey: config.webhookKey,
        active: config.active,
        defaultStatusId: config.defaultStatusId,
        defaultAssignedUserId: config.defaultAssignedUserId,
      },
      message: 'Configuration Google Ads Lead Forms mise à jour avec succès.',
    });
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour de la configuration Google Ads Lead Forms:', error);

    if (error.message === 'Non authentifié') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (error.message === 'Permissions insuffisantes') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/settings/google-ads/[id] - Supprimer une configuration (admin uniquement)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin(request.headers);

    const { id } = await params;
    const client = prisma as any;

    const existingConfig = await client.googleAdsLeadConfig.findUnique({
      where: { id },
    });

    if (!existingConfig) {
      return NextResponse.json({ error: 'Configuration non trouvée' }, { status: 404 });
    }

    await client.googleAdsLeadConfig.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Configuration Google Ads Lead Forms supprimée avec succès.',
    });
  } catch (error: any) {
    console.error('Erreur lors de la suppression de la configuration Google Ads Lead Forms:', error);

    if (error.message === 'Non authentifié') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (error.message === 'Permissions insuffisantes') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}

