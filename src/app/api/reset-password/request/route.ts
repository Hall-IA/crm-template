import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email requis" }, { status: 400 });
    }

    // Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        accounts: {
          where: { providerId: "credential" },
        },
      },
    });

    // Ne pas révéler si l'email existe ou non (sécurité)
    // Mais on envoie quand même un message de succès
    if (!user || user.accounts.length === 0) {
      // Retourner un succès même si l'utilisateur n'existe pas (sécurité)
      return NextResponse.json({
        success: true,
        message: "Si cet email existe, un code vous a été envoyé",
      });
    }

    // Générer un code à 6 chiffres
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Créer ou mettre à jour le token de vérification
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // Valide 15 minutes

    // Supprimer les anciens tokens pour cet email
    await prisma.verification.deleteMany({
      where: {
        identifier: email,
      },
    });

    // Créer le nouveau token avec le code
    await prisma.verification.create({
      data: {
        id: crypto.randomUUID(),
        identifier: email,
        value: code,
        expiresAt,
      },
    });

    // Envoyer l'email avec le code
    const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";

    try {
      await fetch(`${baseUrl}/api/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: email,
          subject: "Code de réinitialisation de mot de passe",
          template: "reset-password",
          code,
        }),
      });
    } catch (emailError) {
      console.error("Erreur lors de l'envoi de l'email:", emailError);
      // On continue même si l'email échoue
    }

    return NextResponse.json({
      success: true,
      message: "Si cet email existe, un code vous a été envoyé",
    });
  } catch (error: any) {
    console.error("Erreur lors de la demande de réinitialisation:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

