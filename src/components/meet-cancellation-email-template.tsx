interface MeetCancellationEmailTemplateProps {
  contactName: string;
  title: string;
  scheduledAt: string;
  durationMinutes?: number;
  meetLink?: string;
  description?: string;
  organizerName: string;
  signature?: string;
}

export function MeetCancellationEmailTemplate({
  contactName,
  title,
  scheduledAt,
  durationMinutes,
  meetLink,
  description,
  organizerName,
  signature,
}: MeetCancellationEmailTemplateProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} minutes`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) {
      return `${hours} heure${hours > 1 ? 's' : ''}`;
    }
    return `${hours} heure${hours > 1 ? 's' : ''} ${mins} minute${mins > 1 ? 's' : ''}`;
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', lineHeight: '1.6', color: '#333' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
        <h1 style={{ color: '#EF4444', fontSize: '24px', marginBottom: '20px' }}>
          Annulation de rendez-vous
        </h1>

        <p style={{ fontSize: '16px', marginBottom: '20px' }}>Bonjour {contactName},</p>

        <p style={{ fontSize: '16px', marginBottom: '20px' }}>
          Nous vous informons que votre rendez-vous a été annulé.
        </p>

        <div
          style={{
            backgroundColor: '#FEF2F2',
            borderLeft: '4px solid #EF4444',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px',
          }}
        >
          <h2 style={{ color: '#1a1a1a', fontSize: '20px', marginBottom: '15px' }}>{title}</h2>

          <div style={{ marginBottom: '10px' }}>
            <strong>Date :</strong> {formatDate(scheduledAt)}
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>Heure :</strong> {formatTime(scheduledAt)}
          </div>
          {meetLink && durationMinutes && (
            <div style={{ marginBottom: '10px' }}>
              <strong>Durée :</strong> {formatDuration(durationMinutes)}
            </div>
          )}
          <div style={{ marginBottom: '10px' }}>
            <strong>Organisateur :</strong> {organizerName}
          </div>

          {description && (
            <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #ddd' }}>
              <strong>Description :</strong>
              <div
                style={{ marginTop: '10px' }}
                dangerouslySetInnerHTML={{ __html: description }}
              />
            </div>
          )}
        </div>

        <p style={{ fontSize: '16px', marginBottom: '20px', color: '#666' }}>
          Si vous souhaitez reprogrammer ce rendez-vous, n'hésitez pas à nous contacter.
        </p>

        {signature && (
          <div
            style={{
              marginTop: '30px',
              paddingTop: '20px',
              borderTop: '1px solid #ddd',
              fontSize: '14px',
            }}
            dangerouslySetInnerHTML={{ __html: signature }}
          />
        )}
      </div>
    </div>
  );
}
