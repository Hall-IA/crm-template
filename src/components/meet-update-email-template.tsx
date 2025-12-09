import React from 'react';

interface MeetUpdateEmailTemplateProps {
  contactName: string;
  title: string;
  oldScheduledAt: string;
  newScheduledAt: string;
  oldDurationMinutes: number;
  newDurationMinutes: number;
  meetLink: string;
  description?: string;
  organizerName: string;
  signature?: string;
}

export function MeetUpdateEmailTemplate({
  contactName,
  title,
  oldScheduledAt,
  newScheduledAt,
  oldDurationMinutes,
  newDurationMinutes,
  meetLink,
  description,
  organizerName,
  signature,
}: MeetUpdateEmailTemplateProps) {
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

  const hasDateChanged = oldScheduledAt !== newScheduledAt;
  const hasDurationChanged = oldDurationMinutes !== newDurationMinutes;

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', lineHeight: '1.6', color: '#333' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
        <h1 style={{ color: '#1a1a1a', fontSize: '24px', marginBottom: '20px' }}>
          Modification de rendez-vous
        </h1>

        <p style={{ fontSize: '16px', marginBottom: '20px' }}>Bonjour {contactName},</p>

        <p style={{ fontSize: '16px', marginBottom: '20px' }}>
          Les informations de votre rendez-vous ont été modifiées.
        </p>

        <div
          style={{
            backgroundColor: '#f5f5f5',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px',
          }}
        >
          <h2 style={{ color: '#1a1a1a', fontSize: '20px', marginBottom: '15px' }}>{title}</h2>

          {hasDateChanged && (
            <div style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #ddd' }}>
              <div style={{ marginBottom: '10px' }}>
                <strong>Ancienne date :</strong>{' '}
                <span style={{ textDecoration: 'line-through', color: '#999' }}>
                  {formatDate(oldScheduledAt)} à {formatTime(oldScheduledAt)}
                </span>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <strong>Nouvelle date :</strong>{' '}
                <span style={{ color: '#10B981', fontWeight: 'bold' }}>
                  {formatDate(newScheduledAt)} à {formatTime(newScheduledAt)}
                </span>
              </div>
            </div>
          )}

          {!hasDateChanged && (
            <div style={{ marginBottom: '10px' }}>
              <strong>Date :</strong> {formatDate(newScheduledAt)}
            </div>
          )}

          {hasDurationChanged && (
            <div style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #ddd' }}>
              <div style={{ marginBottom: '10px' }}>
                <strong>Ancienne durée :</strong>{' '}
                <span style={{ textDecoration: 'line-through', color: '#999' }}>
                  {formatDuration(oldDurationMinutes)}
                </span>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <strong>Nouvelle durée :</strong>{' '}
                <span style={{ color: '#10B981', fontWeight: 'bold' }}>
                  {formatDuration(newDurationMinutes)}
                </span>
              </div>
            </div>
          )}

          {!hasDurationChanged && (
            <div style={{ marginBottom: '10px' }}>
              <strong>Durée :</strong> {formatDuration(newDurationMinutes)}
            </div>
          )}

          {!hasDateChanged && (
            <div style={{ marginBottom: '10px' }}>
              <strong>Heure :</strong> {formatTime(newScheduledAt)}
            </div>
          )}

          <div style={{ marginBottom: '10px' }}>
            <strong>Organisateur :</strong> {organizerName}
          </div>

          {description && (
            <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #ddd' }}>
              <strong>Description :</strong>
              <div style={{ marginTop: '10px' }} dangerouslySetInnerHTML={{ __html: description }} />
            </div>
          )}
        </div>

        <div style={{ marginBottom: '30px', textAlign: 'center' }}>
          <a
            href={meetLink}
            style={{
              display: 'inline-block',
              backgroundColor: '#4285f4',
              color: '#ffffff',
              padding: '12px 24px',
              textDecoration: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: 'bold',
            }}
          >
            Rejoindre la réunion Google Meet
          </a>
        </div>

        <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #ddd' }}>
          <p style={{ fontSize: '14px', color: '#666' }}>
            <strong>Lien de la réunion :</strong>
            <br />
            <a href={meetLink} style={{ color: '#4285f4', wordBreak: 'break-all' }}>
              {meetLink}
            </a>
          </p>
        </div>

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

