import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token manquant' }, { status: 400 });
    }

    // Trouver le token de vérification
    const verification = await prisma.verification.findFirst({
      where: {
        value: token,
        expiresAt: {
          gt: new Date(), // Pas expiré
        },
      },
    });

    if (!verification) {
      return NextResponse.json({ error: 'Lien invalide ou expiré' }, { status: 400 });
    }

    // Vérifier si l'utilisateur existe et n'a pas encore de compte
    const user = await prisma.user.findUnique({
      where: { email: verification.identifier },
      include: {
        accounts: {
          where: { providerId: 'credential' },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Vérifier si le compte existe déjà (mot de passe déjà défini)
    if (user.accounts.length > 0) {
      return NextResponse.json({ error: 'Ce compte a déjà été activé' }, { status: 400 });
    }

    return NextResponse.json({
      email: user.email,
      name: user.name,
      valid: true,
    });
  } catch (error) {
    console.error('Erreur lors de la validation:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
