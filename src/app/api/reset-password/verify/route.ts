import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json({ error: "Email et code requis" }, { status: 400 });
    }

    if (code.length !== 6 || !/^\d+$/.test(code)) {
      return NextResponse.json({ error: "Code invalide" }, { status: 400 });
    }

    // Trouver le token de vérification
    const verification = await prisma.verification.findFirst({
      where: {
        identifier: email,
        value: code,
        expiresAt: {
          gt: new Date(), // Pas expiré
        },
      },
    });

    if (!verification) {
      return NextResponse.json({ error: "Code invalide ou expiré" }, { status: 400 });
    }

    // Vérifier si l'utilisateur existe et a un compte
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        accounts: {
          where: { providerId: "credential" },
        },
      },
    });

    if (!user || user.accounts.length === 0) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Générer un token pour la réinitialisation (différent du code)
    const resetToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Valide 1 heure

    // Supprimer l'ancien token de code
    await prisma.verification.delete({
      where: { id: verification.id },
    });

    // Créer un nouveau token pour la réinitialisation
    await prisma.verification.create({
      data: {
        id: crypto.randomUUID(),
        identifier: email,
        value: resetToken,
        expiresAt,
      },
    });

    return NextResponse.json({
      success: true,
      token: resetToken,
    });
  } catch (error) {
    console.error("Erreur lors de la vérification:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

