import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/roles';
import { encrypt } from '@/lib/encryption';

// GET /api/settings/meta-leads - Récupérer toutes les configurations Meta Lead Ads (admin uniquement)
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request.headers);

    const configs = await prisma.metaLeadConfig.findMany({
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
      configs.map((config) => ({
        id: config.id,
        name: config.name,
        pageId: config.pageId,
        verifyToken: config.verifyToken,
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
    console.error('Erreur lors de la récupération des configurations Meta Lead Ads:', error);

    if (error.message === 'Non authentifié') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (error.message === 'Permissions insuffisantes') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/settings/meta-leads - Créer une nouvelle configuration (admin uniquement)
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request.headers);

    const body = await request.json();
    const {
      name,
      pageId,
      accessToken,
      verifyToken,
      active = true,
      defaultStatusId,
      defaultAssignedUserId,
    } = body;

    if (!name || !pageId || !accessToken || !verifyToken) {
      return NextResponse.json(
        {
          error:
            'Les champs nom, pageId, accessToken et verifyToken sont obligatoires pour activer Meta Lead Ads.',
        },
        { status: 400 },
      );
    }

    let encryptedAccessToken: string;
    try {
      encryptedAccessToken = encrypt(accessToken);
    } catch (encryptError: any) {
      console.error("Erreur lors du chiffrement du jeton d'accès Meta:", encryptError);
      return NextResponse.json(
        { error: `Erreur de chiffrement: ${encryptError.message}` },
        { status: 500 },
      );
    }

    const config = await prisma.metaLeadConfig.create({
      data: {
        name,
        pageId,
        accessToken: encryptedAccessToken,
        verifyToken,
        active: !!active,
        defaultStatusId: defaultStatusId || null,
        defaultAssignedUserId: defaultAssignedUserId || null,
      },
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
      message: 'Configuration Meta Lead Ads créée avec succès.',
    });
  } catch (error: any) {
    console.error('Erreur lors de la création de la configuration Meta Lead Ads:', error);

    if (error.message === 'Non authentifié') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (error.message === 'Permissions insuffisantes') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}
