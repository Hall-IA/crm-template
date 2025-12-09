import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/auth/google/disconnect
 * Déconnecte le compte Google de l'utilisateur
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Supprimer le compte Google
    await prisma.userGoogleAccount.deleteMany({
      where: { userId: session.user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erreur lors de la déconnexion Google:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la déconnexion' },
      { status: 500 },
    );
  }
}
