import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/auth/check-active - Vérifie si l'utilisateur courant est actif
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session || !session.user?.id) {
      return NextResponse.json({ active: false }, { status: 200 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { active: true },
    });

    const isActive = user?.active ?? true;

    return NextResponse.json({ active: isActive }, { status: 200 });
  } catch (error: any) {
    console.error('Erreur lors de la vérification du statut utilisateur:', error);
    return NextResponse.json(
      { active: false, error: error.message || 'Erreur serveur' },
      { status: 200 },
    );
  }
}


