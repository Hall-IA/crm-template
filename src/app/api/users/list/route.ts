import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkPermission } from '@/lib/check-permission';

// GET /api/users/list - Récupérer la liste des utilisateurs avec leurs profils (pour les admins)
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Vérifier que l'utilisateur a la permission de gérer les rôles (admin)
    const hasPermission = await checkPermission('users.manage_roles');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Récupérer tous les utilisateurs avec leurs profils
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        customRole: {
          select: {
            id: true,
            name: true,
            permissions: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(users);
  } catch (error: any) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
