interface EmailTemplateProps {
  firstName: string;
  signature?: string | null;
}

export function EmailTemplate({ firstName, signature }: EmailTemplateProps) {
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
        Welcome, {firstName}!
      </h1>

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
