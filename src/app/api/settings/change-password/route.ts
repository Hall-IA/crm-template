import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { compare } from 'bcryptjs';
import { auth, hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({ error: 'Tous les champs sont requis' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Le nouveau mot de passe doit contenir au moins 6 caractères' },
        { status: 400 },
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'Les nouveaux mots de passe ne correspondent pas' },
        { status: 400 },
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: "Le nouveau mot de passe doit être différent de l'actuel" },
        { status: 400 },
      );
    }

    // Récupérer l'utilisateur avec son compte
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        accounts: {
          where: { providerId: 'credential' },
        },
      },
    });

    if (!user || user.accounts.length === 0) {
      return NextResponse.json({ error: 'Compte non trouvé' }, { status: 404 });
    }

    const account = user.accounts[0];

    // Vérifier le mot de passe actuel
    if (!account.password) {
      return NextResponse.json(
        { error: 'Aucun mot de passe défini pour ce compte' },
        { status: 400 },
      );
    }

    const isCurrentPasswordValid = await compare(currentPassword, account.password);

    if (!isCurrentPasswordValid) {
      return NextResponse.json({ error: 'Mot de passe actuel incorrect' }, { status: 400 });
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await hashPassword(newPassword);

    // Mettre à jour le mot de passe
    await prisma.account.update({
      where: { id: account.id },
      data: {
        password: hashedPassword,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Mot de passe modifié avec succès',
    });
  } catch (error: any) {
    console.error('Erreur lors du changement de mot de passe:', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}
