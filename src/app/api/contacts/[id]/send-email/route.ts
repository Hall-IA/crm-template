import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";
import { decrypt } from "@/lib/encryption";

// POST /api/contacts/[id]/send-email - Envoyer un email au contact
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { subject, content } = body;

    // Validation
    if (!subject || !content) {
      return NextResponse.json(
        { error: "Le sujet et le contenu sont requis" },
        { status: 400 }
      );
    }

    // Récupérer le contact
    const contact = await prisma.contact.findUnique({
      where: { id },
    });

    if (!contact) {
      return NextResponse.json(
        { error: "Contact non trouvé" },
        { status: 404 }
      );
    }

    if (!contact.email) {
      return NextResponse.json(
        { error: "Le contact n'a pas d'email" },
        { status: 400 }
      );
    }

    // Récupérer la configuration SMTP de l'utilisateur
    const smtpConfig = await prisma.smtpConfig.findUnique({
      where: { userId: session.user.id },
    });

    if (!smtpConfig) {
      return NextResponse.json(
        { error: "Configuration SMTP non trouvée. Veuillez configurer votre SMTP dans les paramètres." },
        { status: 400 }
      );
    }

    // Déchiffrer le mot de passe SMTP
    let password: string;
    try {
      password = decrypt(smtpConfig.password);
    } catch (error) {
      // Si le déchiffrement échoue, utiliser le mot de passe tel quel (ancien format non chiffré)
      password = smtpConfig.password;
    }

    // Créer le transporteur SMTP
    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: {
        user: smtpConfig.username,
        pass: password,
      },
    });

    // Construire le contenu avec la signature (si définie)
    const signatureText = smtpConfig.signature ? `\n\n${smtpConfig.signature}` : '';
    const signatureHtml = smtpConfig.signature
      ? `<br><br>${smtpConfig.signature.replace(/\n/g, '<br>')}`
      : '';

    // Envoyer l'email
    const mailOptions = {
      from: smtpConfig.fromName
        ? `"${smtpConfig.fromName}" <${smtpConfig.fromEmail}>`
        : smtpConfig.fromEmail,
      to: contact.email,
      subject: subject,
      text: `${content}${signatureText}`,
      html: `${content.replace(/\n/g, "<br>")}${signatureHtml}`, // Convertir les retours à la ligne et ajouter la signature
    };

    await transporter.sendMail(mailOptions);

    // Créer une interaction de type EMAIL
    const interaction = await prisma.interaction.create({
      data: {
        contactId: id,
        type: "EMAIL",
        title: subject,
        content: content,
        userId: session.user.id,
        date: new Date(),
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Email envoyé avec succès",
      interaction,
    });
  } catch (error: any) {
    console.error("Erreur lors de l'envoi de l'email:", error);
    
    // Gérer les erreurs spécifiques de nodemailer
    if (error.code === "EAUTH" || error.code === "ECONNECTION") {
      return NextResponse.json(
        { error: "Erreur d'authentification SMTP. Vérifiez votre configuration." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Erreur lors de l'envoi de l'email" },
      { status: 500 }
    );
  }
}

