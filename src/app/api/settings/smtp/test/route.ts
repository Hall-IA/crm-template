import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import nodemailer from 'nodemailer';

function htmlToText(html: string): string {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// POST /api/settings/smtp/test - Tester la connexion SMTP
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const { host, port, secure, username, password, fromEmail, fromName, signature } = body;

    // Validation
    if (!host || !port || !username || !password || !fromEmail) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis pour tester la connexion' },
        { status: 400 },
      );
    }

    // Créer un transporteur SMTP de test
    const transporter = nodemailer.createTransport({
      host,
      port: parseInt(port),
      secure: secure === true || secure === 'true', // true pour 465, false pour les autres ports
      auth: {
        user: username,
        pass: password,
      },
      // Options de test
      connectionTimeout: 10000, // 10 secondes
      greetingTimeout: 10000,
    });

    // Tester la connexion
    try {
      await transporter.verify();

      // Construire le contenu de test avec la signature éventuelle
      const baseHtml = `
        <div style="font-family: Arial, sans-serif;">
          <h2 style="color: #4F46E5;">Test de configuration SMTP</h2>
          <p>Ceci est un email de test pour vérifier que votre configuration SMTP fonctionne correctement.</p>
          <p style="color: #10B981; font-weight: bold;">✅ Votre configuration SMTP est opérationnelle !</p>
        </div>
      `;

      const baseText =
        'Test de configuration SMTP\n\nCeci est un email de test pour vérifier que votre configuration SMTP fonctionne correctement.\n\n✅ Votre configuration SMTP est opérationnelle !';

      const signatureHtml = signature ? `<br><br>${signature}` : '';
      const signatureText = signature ? `\n\n${htmlToText(signature)}` : '';

      const finalHtml = `${baseHtml}${signatureHtml}`;
      const finalText = `${baseText}${signatureText}`;

      // Si la vérification réussit, essayer d'envoyer un email de test
      try {
        const testEmail = await transporter.sendMail({
          from: `"${fromName}" <${fromEmail}>`,
          to: session.user.email, // Envoyer à l'utilisateur connecté
          subject: 'Test de configuration SMTP - CRM',
          text: finalText,
          html: finalHtml,
        });

        return NextResponse.json({
          success: true,
          message: 'Connexion SMTP réussie ! Un email de test a été envoyé à votre adresse.',
          messageId: testEmail.messageId,
        });
      } catch (sendError: any) {
        // La connexion fonctionne mais l'envoi a échoué
        return NextResponse.json(
          {
            success: false,
            message: "Connexion SMTP réussie, mais l'envoi de l'email de test a échoué",
            error: sendError.message,
          },
          { status: 200 },
        ); // On retourne 200 car la connexion fonctionne
      }
    } catch (verifyError: any) {
      // La connexion a échoué
      return NextResponse.json(
        {
          success: false,
          message: 'Échec de la connexion SMTP',
          error: verifyError.message || 'Impossible de se connecter au serveur SMTP',
        },
        { status: 400 },
      );
    }
  } catch (error: any) {
    console.error('Erreur lors du test SMTP:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Erreur lors du test de connexion',
        error: error.message || 'Erreur serveur',
      },
      { status: 500 },
    );
  }
}
