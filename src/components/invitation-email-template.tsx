interface InvitationEmailProps {
  name: string;
  invitationUrl: string;
  signature?: string | null;
}

export function InvitationEmailTemplate({ name, invitationUrl, signature }: InvitationEmailProps) {
  return (
    <div
      style={{
        fontFamily: 'Arial, sans-serif',
        padding: '20px',
        maxWidth: '600px',
        margin: '0 auto',
      }}
    >
      <h1 style={{ color: '#1F2937', fontSize: '24px', marginBottom: '16px' }}>
        Bienvenue, {name} !
      </h1>
      <p style={{ color: '#4B5563', fontSize: '16px', lineHeight: '1.6', marginBottom: '16px' }}>
        Vous avez été invité à rejoindre notre plateforme CRM.
      </p>
      <p style={{ color: '#4B5563', fontSize: '16px', lineHeight: '1.6', marginBottom: '24px' }}>
        Cliquez sur le bouton ci-dessous pour définir votre mot de passe et activer votre compte :
      </p>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <a
          href={invitationUrl}
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            backgroundColor: '#4F46E5',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '6px',
            fontWeight: '600',
            fontSize: '16px',
          }}
        >
          Définir mon mot de passe
        </a>
      </div>
      <p style={{ color: '#6B7280', fontSize: '14px', lineHeight: '1.6', marginBottom: '8px' }}>
        Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :
      </p>
      <p
        style={{ color: '#4F46E5', fontSize: '12px', wordBreak: 'break-all', marginBottom: '24px' }}
      >
        {invitationUrl}
      </p>
      <p
        style={{
          color: '#9CA3AF',
          fontSize: '12px',
          marginTop: '32px',
          paddingTop: '16px',
          borderTop: '1px solid #E5E7EB',
        }}
      >
        Ce lien est valide pendant 24 heures. Si vous n'avez pas demandé cette invitation, vous
        pouvez ignorer cet email.
      </p>

      {signature && (
        <div
          style={{
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: '1px solid #E5E7EB',
            color: '#4B5563',
            fontSize: '14px',
            lineHeight: '1.6',
          }}
          dangerouslySetInnerHTML={{ __html: signature }}
        />
      )}
    </div>
  );
}
