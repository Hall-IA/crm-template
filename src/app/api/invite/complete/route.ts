import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json({ error: 'Token et mot de passe requis' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 6 caractères' },
        { status: 400 },
      );
    }

    // Valider le token
    const verification = await prisma.verification.findFirst({
      where: {
        value: token,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!verification) {
      return NextResponse.json({ error: 'Lien invalide ou expiré' }, { status: 400 });
    }

    // Trouver l'utilisateur
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

    // Vérifier si le compte existe déjà
    if (user.accounts.length > 0) {
      return NextResponse.json({ error: 'Ce compte a déjà été activé' }, { status: 400 });
    }

    const newPassword = await hashPassword(password);

    // Créer l'Account avec le mot de passe haché
    await prisma.account.create({
      data: {
        id: crypto.randomUUID(),
        accountId: user.id,
        providerId: 'credential',
        userId: user.id,
        password: newPassword,
      },
    });

    // Supprimer le token de vérification
    await prisma.verification.delete({
      where: { id: verification.id },
    });

    // Mettre à jour l'utilisateur comme vérifié
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Mot de passe défini avec succès',
    });
  } catch (error: any) {
    console.error('Erreur lors de la complétion:', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}
