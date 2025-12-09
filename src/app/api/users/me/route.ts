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

    // Récupérer l'utilisateur avec son rôle depuis la base de données
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Retourner l'utilisateur avec le rôle
    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: (user as any).role || 'USER',
      emailVerified: user.emailVerified,
      image: user.image,
    });
  } catch (error) {
    console.error('Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
