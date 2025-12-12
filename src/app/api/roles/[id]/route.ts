import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { checkPermission } from '@/lib/check-permission';

// PUT /api/roles/[id] - Modifier un profil
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;
    const body = await req.json();
    const { name, description, permissions } = body;

    // Vérifier que le profil existe
    const existingRole = await prisma.customRole.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    if (!existingRole) {
      return NextResponse.json(
        { error: 'Profil non trouvé' },
        { status: 404 }
      );
    }

    // Validation
    if (name && typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Le nom doit être une chaîne de caractères' },
        { status: 400 }
      );
    }

    if (permissions && !Array.isArray(permissions)) {
      return NextResponse.json(
        { error: 'Les permissions doivent être un tableau' },
        { status: 400 }
      );
    }

    // Vérifier que le nouveau nom n'existe pas déjà (si changé)
    if (name && name.trim() !== existingRole.name) {
      const duplicateName = await prisma.customRole.findUnique({
        where: { name: name.trim() },
      });

      if (duplicateName) {
        return NextResponse.json(
          { error: 'Un profil avec ce nom existe déjà' },
          { status: 400 }
        );
      }
    }

    // Mettre à jour le profil
    const updatedRole = await prisma.customRole.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(permissions && { permissions }),
      },
    });

    return NextResponse.json({
      message: 'Profil modifié avec succès',
      role: {
        id: updatedRole.id,
        name: updatedRole.name,
        description: updatedRole.description,
        permissions: updatedRole.permissions,
        isSystem: updatedRole.isSystem,
        usersCount: existingRole._count.users,
        createdAt: updatedRole.createdAt.toISOString(),
        updatedAt: updatedRole.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Erreur lors de la modification du profil:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// DELETE /api/roles/[id] - Supprimer un profil
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;

    // Vérifier que le profil existe
    const existingRole = await prisma.customRole.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    if (!existingRole) {
      return NextResponse.json(
        { error: 'Profil non trouvé' },
        { status: 404 }
      );
    }

    // Empêcher la suppression si des utilisateurs utilisent ce profil
    if (existingRole._count.users > 0) {
      return NextResponse.json(
        {
          error: `Ce profil ne peut pas être supprimé car ${existingRole._count.users} l'utilisent`,
        },
        { status: 400 }
      );
    }

    // Supprimer le profil
    await prisma.customRole.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'Profil supprimé avec succès',
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du profil:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

