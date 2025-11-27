import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token manquant" }, { status: 400 });
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
      return NextResponse.json({ error: "Lien invalide ou expiré" }, { status: 400 });
    }

    // Vérifier si l'utilisateur existe et a un compte
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

    return NextResponse.json({
      email: user.email,
      valid: true,
    });
  } catch (error) {
    console.error("Erreur lors de la validation:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

