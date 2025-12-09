interface ResetPasswordEmailProps {
  code: string;
  signature?: string | null;
}

export function ResetPasswordEmailTemplate({ code, signature }: ResetPasswordEmailProps) {
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
        Réinitialisation de mot de passe
      </h1>
      <p style={{ color: '#4B5563', fontSize: '16px', lineHeight: '1.6', marginBottom: '16px' }}>
        Vous avez demandé à réinitialiser votre mot de passe.
      </p>
      <p style={{ color: '#4B5563', fontSize: '16px', lineHeight: '1.6', marginBottom: '24px' }}>
        Utilisez le code suivant pour continuer :
      </p>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div
          style={{
            display: 'inline-block',
            padding: '20px 40px',
            backgroundColor: '#F3F4F6',
            borderRadius: '8px',
            border: '2px solid #4F46E5',
          }}
        >
          <div
            style={{
              fontSize: '36px',
              fontWeight: 'bold',
              letterSpacing: '8px',
              color: '#4F46E5',
              fontFamily: 'monospace',
            }}
          >
            {code}
          </div>
        </div>
      </div>
      <p style={{ color: '#6B7280', fontSize: '14px', lineHeight: '1.6', marginBottom: '8px' }}>
        Ce code est valide pendant 15 minutes.
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
        Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email. Votre mot
        de passe ne sera pas modifié.
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
