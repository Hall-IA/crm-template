import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/auth/google/status
 * Récupère le statut de connexion Google de l'utilisateur
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const googleAccount = await prisma.userGoogleAccount.findUnique({
      where: { userId: session.user.id },
      select: { email: true },
    });

    return NextResponse.json({
      connected: !!googleAccount,
      email: googleAccount?.email || null,
    });
  } catch (error: any) {
    console.error('Erreur lors de la récupération du statut Google:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}

