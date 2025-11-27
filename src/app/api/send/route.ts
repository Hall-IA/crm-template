import { EmailTemplate } from '@/components/email-template';
import { InvitationEmailTemplate } from '@/components/invitation-email-template';
import { ResetPasswordEmailTemplate } from '@/components/reset-password-email-template';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const isDevelopment = process.env.NODE_ENV === 'development';
const DEV_EMAIL = process.env.DEV_EMAIL || 'dev@example.com'; // Votre email de test

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { to, subject, template, ...emailData } = body;

    // En développement : logger l'email au lieu de l'envoyer
    if (isDevelopment) {
      console.log('📧 [DEV MODE] Email would be sent:');
      console.log({
        from: process.env.RESEND_FROM_EMAIL || 'Acme <onboarding@resend.dev>',
        to: isDevelopment ? DEV_EMAIL : to,
        subject,
        template,
        data: emailData,
      });
      
      // Afficher le lien d'invitation dans la console si c'est une invitation
      if (template === 'invitation' && emailData.invitationUrl) {
        console.log('🔗 Lien d\'invitation:', emailData.invitationUrl);
      }
      
      // Afficher le code de réinitialisation dans la console
      if (template === 'reset-password' && emailData.code) {
        console.log('🔑 Code de réinitialisation:', emailData.code);
      }
      
      // Optionnel : retourner une réponse simulée
      return Response.json({
        id: 'dev-email-id',
        message: 'Email logged in development mode (not sent)',
      });
    }

    // Sélectionner le template approprié
    let emailComponent;
    if (template === 'invitation') {
      emailComponent = InvitationEmailTemplate({
        name: emailData.name || 'Utilisateur',
        invitationUrl: emailData.invitationUrl || '',
      });
    } else if (template === 'reset-password') {
      emailComponent = ResetPasswordEmailTemplate({
        code: emailData.code || '',
      });
    } else {
      emailComponent = EmailTemplate(emailData);
    }

    // En production : envoyer réellement l'email
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Acme <onboarding@resend.dev>',
      to: Array.isArray(to) ? to : [to],
      subject,
      react: emailComponent,
    });

    if (error) {
      return Response.json({ error }, { status: 500 });
    }

    return Response.json(data);
  } catch (error) {
    return Response.json({ error }, { status: 500 });
  }
}
