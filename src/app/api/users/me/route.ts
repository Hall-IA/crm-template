import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/users/me - Récupérer les informations de l'utilisateur actuel (y compris le rôle)
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Récupérer l'utilisateur avec son profil depuis la base de données
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        customRole: {
          select: {
            id: true,
            name: true,
            permissions: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Retourner l'utilisateur avec son profil et ses permissions
    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: 'USER', // Tous les utilisateurs ont le rôle USER
      customRole: user.customRole,
      emailVerified: user.emailVerified,
      image: user.image,
    });
  } catch (error) {
    console.error('Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
