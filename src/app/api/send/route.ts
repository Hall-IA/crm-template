import { EmailTemplate } from '@/components/email-template';
import { InvitationEmailTemplate } from '@/components/invitation-email-template';
import { ResetPasswordEmailTemplate } from '@/components/reset-password-email-template';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/encryption';
import { auth } from '@/lib/auth';
import nodemailer from 'nodemailer';
import { render } from '@react-email/render';
import React from 'react';

const isDevelopment = process.env.NODE_ENV === 'development';

function htmlToText(html: string): string {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function getAdminSmtpConfig(userId: string) {
  try {
    // Récupérer la configuration SMTP de l'administrateur connecté
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        smtpConfig: true,
      },
    });

    if (!user) {
      console.error('❌ Utilisateur non trouvé:', userId);
      return { config: null, error: 'Utilisateur non trouvé' };
    }

    if (!user.smtpConfig) {
      console.error('❌ Aucune configuration SMTP trouvée pour l\'utilisateur:', user.email);
      return {
        config: null,
        error: 'Vous devez configurer votre SMTP dans les paramètres avant de pouvoir envoyer des emails.',
      };
    }

    console.log('✅ Configuration SMTP trouvée pour:', user.email);
    return { config: user.smtpConfig, error: null };
  } catch (error) {
    console.error('Erreur lors de la récupération de la configuration SMTP:', error);
    return {
      config: null,
      error: 'Erreur lors de la récupération de la configuration SMTP.',
    };
  }
}

async function getAnyAdminSmtpConfig() {
  try {
    // Récupérer la première configuration SMTP d'un administrateur
    // On cherche directement dans SmtpConfig et on joint avec User pour vérifier le rôle
    const smtpConfig = await prisma.smtpConfig.findFirst({
      where: {
        user: {
          role: 'ADMIN',
        },
      },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (!smtpConfig) {
      console.error('❌ Aucune configuration SMTP trouvée pour un administrateur');
      
      // Log supplémentaire pour debug : vérifier s'il y a des admins
      const adminCount = await prisma.user.count({
        where: { role: 'ADMIN' },
      });
      const smtpConfigCount = await prisma.smtpConfig.count();
      console.error('Debug - Admins:', adminCount, 'Configs SMTP:', smtpConfigCount);
      
      return {
        config: null,
        error: 'Aucune configuration SMTP trouvée. Veuillez configurer SMTP dans les paramètres.',
      };
    }

    console.log('✅ Configuration SMTP trouvée pour l\'admin:', smtpConfig.user.email);
    return { config: smtpConfig, error: null };
  } catch (error) {
    console.error('Erreur lors de la récupération de la configuration SMTP admin:', error);
    return {
      config: null,
      error: 'Erreur lors de la récupération de la configuration SMTP.',
    };
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { to, subject, template, ...emailData } = body;

    // Récupérer la session de l'utilisateur connecté (optionnel pour reset-password)
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    // Pour le reset password, on n'a pas besoin de session
    const isResetPassword = template === 'reset-password';
    
    if (!isResetPassword && (!session || !session.user?.id)) {
      console.error('❌ Utilisateur non authentifié');
      return Response.json({ error: 'Non authentifié' }, { status: 401 });
    }

    console.log('📧 Tentative d\'envoi d\'email:', {
      to,
      subject,
      template,
      isDevelopment,
      userId: session?.user?.id || 'none (reset-password)',
    });

    // Récupérer la configuration SMTP
    let smtpConfig, smtpError;
    if (isResetPassword) {
      // Pour le reset password, utiliser n'importe quelle config SMTP d'admin
      const result = await getAnyAdminSmtpConfig();
      smtpConfig = result.config;
      smtpError = result.error;
    } else {
      // Pour les autres emails, utiliser la config de l'utilisateur connecté
      const result = await getAdminSmtpConfig(session!.user.id);
      smtpConfig = result.config;
      smtpError = result.error;
    }

    if (!smtpConfig) {
      const errorMsg = smtpError || 'Aucune configuration SMTP trouvée. Veuillez configurer SMTP dans les paramètres.';
      console.error('❌', errorMsg);
      return Response.json({ error: errorMsg }, { status: 400 });
    }

    // Sélectionner le template approprié et le rendre en HTML
    let emailComponent: React.ReactElement;
    if (template === 'invitation') {
      emailComponent = React.createElement(InvitationEmailTemplate, {
        name: emailData.name || 'Utilisateur',
        invitationUrl: emailData.invitationUrl || '',
        signature: smtpConfig.signature,
      });
    } else if (template === 'reset-password') {
      emailComponent = React.createElement(ResetPasswordEmailTemplate, {
        code: emailData.code || '',
        signature: smtpConfig.signature,
      });
    } else {
      emailComponent = React.createElement(EmailTemplate, {
        firstName: emailData.firstName || 'Utilisateur',
        signature: smtpConfig.signature,
      });
    }

    // Rendre le composant React en HTML avec @react-email/render
    const emailHtml = await render(emailComponent);
    const emailText = htmlToText(emailHtml);

    // Logger les informations de l'email (même en production pour le debug)
    if (isDevelopment) {
      console.log('📧 [DEV MODE] Envoi de l\'email:');
      console.log({
        from: smtpConfig.fromName
          ? `"${smtpConfig.fromName}" <${smtpConfig.fromEmail}>`
          : smtpConfig.fromEmail,
        to,
        subject,
        template,
        data: { ...emailData },
      });

      // Afficher le lien d'invitation dans la console si c'est une invitation
      if (template === 'invitation' && emailData.invitationUrl) {
        console.log('🔗 Lien d\'invitation:', emailData.invitationUrl);
      }

      // Afficher le code de réinitialisation dans la console
      if (template === 'reset-password' && emailData.code) {
        console.log('🔑 Code de réinitialisation:', emailData.code);
      }
    }

    // Déchiffrer le mot de passe SMTP
    let password: string;
    try {
      password = decrypt(smtpConfig.password);
    } catch (error) {
      // Si le déchiffrement échoue, utiliser le mot de passe tel quel (ancien format non chiffré)
      console.warn('⚠️ Impossible de déchiffrer le mot de passe SMTP, utilisation du mot de passe brut');
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

    // Envoyer l'email
    const recipients = Array.isArray(to) ? to : [to];
    const mailOptions = {
      from: smtpConfig.fromName
        ? `"${smtpConfig.fromName}" <${smtpConfig.fromEmail}>`
        : smtpConfig.fromEmail,
      to: recipients,
      subject,
      text: emailText,
      html: emailHtml,
    };

    console.log('📤 Envoi de l\'email via SMTP...', {
      from: mailOptions.from,
      to: recipients,
      subject,
    });

    const info = await transporter.sendMail(mailOptions);

    console.log('✅ Email envoyé avec succès:', info.messageId);

    return Response.json({
      id: info.messageId,
      message: 'Email envoyé avec succès',
    });
  } catch (error: any) {
    console.error('❌ Erreur lors de l\'envoi de l\'email:', error);
    console.error('Détails de l\'erreur:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
    });

    // Gérer les erreurs spécifiques de nodemailer
    if (error.code === 'EAUTH' || error.code === 'ECONNECTION') {
      return Response.json(
        {
          error: "Erreur d'authentification SMTP. Vérifiez votre configuration SMTP dans les paramètres.",
          details: error.message,
        },
        { status: 400 },
      );
    }

    return Response.json(
      {
        error: error.message || 'Erreur lors de l\'envoi de l\'email',
        details: error.code || 'UNKNOWN_ERROR',
      },
      { status: 500 },
    );
  }
}
