import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/roles';

// GET /api/settings/google-ads - Récupérer la configuration Google Ads Leads (admin uniquement)
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request.headers);

    // Utiliser un cast any car le client Prisma généré n'est pas encore au courant du nouveau modèle
    const client = prisma as any;

    const config = await client.googleAdsLeadConfig.findFirst({
      include: {
        defaultStatus: true,
        defaultAssignedUser: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!config) {
      return NextResponse.json(null);
    }

    return NextResponse.json({
      id: config.id,
      webhookKey: config.webhookKey,
      active: config.active,
      defaultStatusId: config.defaultStatusId,
      defaultAssignedUserId: config.defaultAssignedUserId,
      defaultStatus: config.defaultStatus
        ? {
            id: config.defaultStatus.id,
            name: config.defaultStatus.name,
            color: config.defaultStatus.color,
          }
        : null,
      defaultAssignedUser: config.defaultAssignedUser || null,
    });
  } catch (error: any) {
    console.error(
      'Erreur lors de la récupération de la configuration Google Ads Lead Forms:',
      error,
    );

    if (error.message === 'Non authentifié') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (error.message === 'Permissions insuffisantes') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PUT /api/settings/google-ads - Créer / mettre à jour la configuration (admin uniquement)
export async function PUT(request: NextRequest) {
  try {
    await requireAdmin(request.headers);

    const body = await request.json();
    const { webhookKey, active = true, defaultStatusId, defaultAssignedUserId } = body;

    if (!webhookKey) {
      return NextResponse.json(
        {
          error:
            'Le champ webhookKey est obligatoire pour activer l’intégration Google Ads (clé secrète partagée).',
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

    const client = prisma as any;

    const config = await client.googleAdsLeadConfig.upsert({
      where: { id: 'google_ads_lead_config_singleton' },
      update: {
        webhookKey,
        active: !!active,
        defaultStatusId: defaultStatusId || null,
        defaultAssignedUserId,
      },
      create: {
        id: 'google_ads_lead_config_singleton',
        webhookKey,
        active: !!active,
        defaultStatusId: defaultStatusId || null,
        defaultAssignedUserId,
      },
    });

    return NextResponse.json({
      success: true,
      config: {
        id: config.id,
        webhookKey: config.webhookKey,
        active: config.active,
        defaultStatusId: config.defaultStatusId,
        defaultAssignedUserId: config.defaultAssignedUserId,
      },
      message: 'Configuration Google Ads Lead Forms sauvegardée avec succès.',
    });
  } catch (error: any) {
    console.error('Erreur lors de la sauvegarde de la configuration Google Ads Lead Forms:', error);

    if (error.message === 'Non authentifié') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (error.message === 'Permissions insuffisantes') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}


