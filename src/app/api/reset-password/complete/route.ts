import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json({ error: "Token et mot de passe requis" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 6 caractères" },
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
      return NextResponse.json({ error: "Lien invalide ou expiré" }, { status: 400 });
    }

    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: verification.identifier },
      include: {
        accounts: {
          where: { providerId: "credential" },
        },
      },
    });

    if (!user || user.accounts.length === 0) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await hashPassword(password);

    // Mettre à jour le mot de passe dans l'Account
    await prisma.account.update({
      where: { id: user.accounts[0].id },
      data: {
        password: hashedPassword,
      },
    });

    // Supprimer le token de vérification
    await prisma.verification.delete({
      where: { id: verification.id },
    });

    return NextResponse.json({
      success: true,
      message: "Mot de passe réinitialisé avec succès",
    });
  } catch (error: any) {
    console.error("Erreur lors de la complétion:", error);
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 });
  }
}

