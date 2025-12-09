import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';
import { decrypt } from '@/lib/encryption';

// POST /api/contacts/[id]/send-email - Envoyer un email au contact
function htmlToText(html: string): string {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { id } = await params;

    // Récupérer FormData
    const formData = await request.formData();
    const to = formData.get('to') as string;
    const cc = formData.get('cc') as string;
    const bcc = formData.get('bcc') as string;
    const subject = formData.get('subject') as string;
    const content = formData.get('content') as string;
    const attachmentCount = parseInt(formData.get('attachmentCount') as string) || 0;

    // Validation
    if (!to || !subject || !content) {
      return NextResponse.json(
        { error: 'Le destinataire, le sujet et le contenu sont requis' },
        { status: 400 },
      );
    }

    // Récupérer le contact
    const contact = await prisma.contact.findUnique({
      where: { id },
    });

    if (!contact) {
      return NextResponse.json({ error: 'Contact non trouvé' }, { status: 404 });
    }

    // Récupérer la configuration SMTP de l'utilisateur
    const smtpConfig = await prisma.smtpConfig.findUnique({
      where: { userId: session.user.id },
    });

    if (!smtpConfig) {
      return NextResponse.json(
        {
          error:
            'Configuration SMTP non trouvée. Veuillez configurer votre SMTP dans les paramètres.',
        },
        { status: 400 },
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

    // Construire les variantes texte / HTML avec la signature (si définie)
    let baseHtml = content || '';
    const baseText = htmlToText(baseHtml);

    // Nettoyer les espaces en fin de contenu HTML
    baseHtml = baseHtml.trim();

    // Ajouter la signature de manière propre avec un espacement raisonnable
    let signatureHtml = '';
    let signatureText = '';

    if (smtpConfig.signature) {
      const signatureContent = smtpConfig.signature.trim();
      // Ajouter un seul saut de ligne pour un espacement naturel
      if (baseHtml.length > 0) {
        signatureHtml = `<br>${signatureContent}`;
      } else {
        signatureHtml = signatureContent;
      }
      signatureText = `\n\n${htmlToText(signatureContent)}`;
    }

    // Préparer les destinataires
    const toEmails = to
      .split(',')
      .map((email) => email.trim())
      .filter((email) => email);
    const ccEmails = cc
      ? cc
          .split(',')
          .map((email) => email.trim())
          .filter((email) => email)
      : [];
    const bccEmails = bcc
      ? bcc
          .split(',')
          .map((email) => email.trim())
          .filter((email) => email)
      : [];

    // Récupérer les pièces jointes
    const attachments: Array<{ filename: string; content: Buffer }> = [];
    for (let i = 0; i < attachmentCount; i++) {
      const file = formData.get(`attachment_${i}`) as File | null;
      if (file) {
        const buffer = Buffer.from(await file.arrayBuffer());
        attachments.push({
          filename: file.name,
          content: buffer,
        });
      }
    }

    // Envoyer l'email
    const mailOptions: any = {
      from: smtpConfig.fromName
        ? `"${smtpConfig.fromName}" <${smtpConfig.fromEmail}>`
        : smtpConfig.fromEmail,
      to: toEmails.join(', '),
      subject: subject,
      text: `${baseText}${signatureText}`,
      html: `${baseHtml}${signatureHtml}`,
    };

    if (ccEmails.length > 0) {
      mailOptions.cc = ccEmails.join(', ');
    }

    if (bccEmails.length > 0) {
      mailOptions.bcc = bccEmails.join(', ');
    }

    if (attachments.length > 0) {
      mailOptions.attachments = attachments;
    }

    await transporter.sendMail(mailOptions);

    // Préparer les métadonnées pour les pièces jointes
    const attachmentNames = attachments.map((att) => att.filename);
    const metadata: any = {};
    if (attachmentNames.length > 0) {
      metadata.attachments = attachmentNames;
    }
    if (ccEmails.length > 0) {
      metadata.cc = ccEmails;
    }
    if (bccEmails.length > 0) {
      metadata.bcc = bccEmails;
    }
    metadata.to = toEmails;
    metadata.htmlContent = `${baseHtml}${signatureHtml}`; // Stocker le HTML pour l'affichage

    // Créer une interaction de type EMAIL (contenu HTML dans metadata, texte brut dans content)
    const interaction = await prisma.interaction.create({
      data: {
        contactId: id,
        type: 'EMAIL',
        title: subject,
        content: baseText, // Texte brut pour la recherche/affichage simple
        userId: session.user.id,
        date: new Date(),
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Email envoyé avec succès',
      interaction,
    });
  } catch (error: any) {
    console.error("Erreur lors de l'envoi de l'email:", error);

    // Gérer les erreurs spécifiques de nodemailer
    if (error.code === 'EAUTH' || error.code === 'ECONNECTION') {
      return NextResponse.json(
        { error: "Erreur d'authentification SMTP. Vérifiez votre configuration." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: error.message || "Erreur lors de l'envoi de l'email" },
      { status: 500 },
    );
  }
}
