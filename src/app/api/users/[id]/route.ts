import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, Role } from '@/lib/roles';

// GET /api/users/[id] - Récupérer un utilisateur spécifique
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request.headers);
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Retourner l'utilisateur avec le rôle
    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || 'USER',
      emailVerified: user.emailVerified,
      active: user.active,
      image: user.image,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error: any) {
    console.error('Erreur:', error);

    if (error.message === 'Non authentifié') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (error.message === 'Permissions insuffisantes') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PUT /api/users/[id] - Mettre à jour un utilisateur
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin(request.headers);
    const { id } = await params;
    const body = await request.json();
    const { name, role, active } = body;

    // Empêcher un admin de se retirer ses propres droits
    if (id === session.user.id && role === Role.USER) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas retirer vos propres droits d'admin" },
        { status: 400 },
      );
    }

    // Vérifier que l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Mettre à jour l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(role && { role: role as any }), // Type assertion pour le champ role
        ...(typeof active === 'boolean' && { active }),
      },
    });

    // Retourner l'utilisateur avec le rôle
    return NextResponse.json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role || 'USER',
      emailVerified: updatedUser.emailVerified,
      active: updatedUser.active,
      updatedAt: updatedUser.updatedAt,
    });
  } catch (error: any) {
    console.error('Erreur:', error);

    if (error.message === 'Non authentifié') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (error.message === 'Permissions insuffisantes') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// NOTE: L'API DELETE n'est plus utilisée : les comptes sont désormais désactivés via le booléen `active`.
