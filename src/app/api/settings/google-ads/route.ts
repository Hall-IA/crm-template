import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/roles';

// GET /api/settings/google-ads - Récupérer toutes les configurations Google Ads Leads (admin uniquement)
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request.headers);

    const client = prisma as any;

    const configs = await client.googleAdsLeadConfig.findMany({
      include: {
        defaultStatus: true,
        defaultAssignedUser: {
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
      })),
    );
  } catch (error: any) {
    console.error(
      'Erreur lors de la récupération des configurations Google Ads Lead Forms:',
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

// POST /api/settings/google-ads - Créer une nouvelle configuration (admin uniquement)
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request.headers);

    const body = await request.json();
    const { name, webhookKey, active = true, defaultStatusId, defaultAssignedUserId } = body;

    if (!name || !webhookKey) {
      return NextResponse.json(
        {
          error:
            'Les champs nom et webhookKey sont obligatoires pour activer l’intégration Google Ads (clé secrète partagée).',
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

    const config = await client.googleAdsLeadConfig.create({
      data: {
        name,
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
        name: config.name,
        webhookKey: config.webhookKey,
        active: config.active,
        defaultStatusId: config.defaultStatusId,
        defaultAssignedUserId: config.defaultAssignedUserId,
      },
      message: 'Configuration Google Ads Lead Forms créée avec succès.',
    });
  } catch (error: any) {
    console.error('Erreur lors de la création de la configuration Google Ads Lead Forms:', error);

    if (error.message === 'Non authentifié') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (error.message === 'Permissions insuffisantes') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}
