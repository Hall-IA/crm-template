import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { checkPermission } from '@/lib/check-permission';

// GET /api/roles - Récupérer tous les profils (système + personnalisés)
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier que l'utilisateur a la permission de gérer les rôles
    const hasPermission = await checkPermission('users.manage_roles');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // Récupérer tous les profils depuis la BDD (système + personnalisés)
    const roles = await prisma.customRole.findMany({
      include: {
        _count: {
          select: { users: true },
        },
      },
      orderBy: [
        { isSystem: 'desc' }, // Profils système en premier
        { createdAt: 'desc' }, // Puis les plus récents
      ],
    });

    // Formatter les profils
    const formattedRoles = roles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: role.permissions as string[],
      isSystem: role.isSystem,
      usersCount: role._count.users,
      createdAt: role.createdAt.toISOString(),
      updatedAt: role.updatedAt.toISOString(),
    }));

    return NextResponse.json(formattedRoles);
  } catch (error) {
    console.error('Erreur lors de la récupération des profils:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST /api/roles - Créer un nouveau profil personnalisé
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier que l'utilisateur a la permission de gérer les rôles
    const hasPermission = await checkPermission('users.manage_roles');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const body = await req.json();
    const { name, description, permissions } = body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Le nom du profil est requis' },
        { status: 400 }
      );
    }

    if (!Array.isArray(permissions)) {
      return NextResponse.json(
        { error: 'Les permissions doivent être un tableau' },
        { status: 400 }
      );
    }

    // Vérifier que le nom n'existe pas déjà
    const existing = await prisma.customRole.findUnique({
      where: { name: name.trim() },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Un profil avec ce nom existe déjà' },
        { status: 400 }
      );
    }

    // Créer le profil
    const newRole = await prisma.customRole.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        permissions: permissions,
        isSystem: false,
      },
    });

    return NextResponse.json(
      {
        message: 'Profil créé avec succès',
        role: {
          id: newRole.id,
          name: newRole.name,
          description: newRole.description,
          permissions: newRole.permissions,
          isSystem: newRole.isSystem,
          usersCount: 0,
          createdAt: newRole.createdAt.toISOString(),
          updatedAt: newRole.updatedAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erreur lors de la création du profil:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

