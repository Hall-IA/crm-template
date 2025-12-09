/**
 * Utilitaires pour gérer l'authentification et les appels à Google Calendar API
 */

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

interface GoogleCalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  attendees?: Array<{ email: string }>;
  conferenceData?: {
    createRequest: {
      requestId: string;
      conferenceSolutionKey: {
        type: 'hangoutsMeet';
      };
    };
  };
  conferenceDataVersion?: number;
}

interface GoogleCalendarEventResponse {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  attendees?: Array<{ email: string }>;
  conferenceData?: {
    createRequest?: {
      requestId: string;
      conferenceSolutionKey: {
        type: 'hangoutsMeet';
      };
    };
    entryPoints?: Array<{
      entryPointType: string;
      uri: string;
    }>;
  };
}

/**
 * Échange un code d'autorisation contre des tokens
 */
export async function exchangeGoogleCodeForTokens(
  code: string,
  redirectUri: string,
): Promise<GoogleTokenResponse> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET doivent être configurés');
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erreur lors de l'échange du code: ${error}`);
  }

  return response.json();
}

/**
 * Rafraîchit un access token expiré
 */
export async function refreshGoogleToken(refreshToken: string): Promise<GoogleTokenResponse> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET doivent être configurés');
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erreur lors du rafraîchissement du token: ${error}`);
  }

  return response.json();
}

/**
 * Obtient un access token valide (rafraîchit si nécessaire)
 */
export async function getValidAccessToken(
  accessToken: string,
  refreshToken: string,
  tokenExpiresAt: Date,
): Promise<string> {
  // Si le token expire dans moins de 5 minutes, on le rafraîchit
  const now = new Date();
  const expiresAt = new Date(tokenExpiresAt);
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

  if (expiresAt <= fiveMinutesFromNow) {
    const newTokens = await refreshGoogleToken(refreshToken);
    return newTokens.access_token;
  }

  return accessToken;
}

/**
 * Crée un évènement Google Calendar avec Google Meet
 */
export async function createGoogleCalendarEvent(
  accessToken: string,
  event: GoogleCalendarEvent,
): Promise<GoogleCalendarEventResponse> {
  const response = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erreur lors de la création de l'évènement: ${error}`);
  }

  return response.json();
}

/**
 * Met à jour un évènement Google Calendar
 */
export async function updateGoogleCalendarEvent(
  accessToken: string,
  eventId: string,
  event: Partial<GoogleCalendarEvent>,
): Promise<GoogleCalendarEventResponse> {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}?conferenceDataVersion=1`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erreur lors de la mise à jour de l'évènement: ${error}`);
  }

  return response.json();
}

/**
 * Supprime un évènement Google Calendar
 */
export async function deleteGoogleCalendarEvent(
  accessToken: string,
  eventId: string,
): Promise<void> {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erreur lors de la suppression de l'évènement: ${error}`);
  }
}

/**
 * Extrait le lien Google Meet depuis la réponse de l'API
 */
export function extractMeetLink(eventResponse: GoogleCalendarEventResponse): string | null {
  if (eventResponse.conferenceData?.entryPoints) {
    const meetEntry = eventResponse.conferenceData.entryPoints.find(
      (entry) => entry.entryPointType === 'video',
    );
    return meetEntry?.uri || null;
  }
  return null;
}

/**
 * Récupère un évènement Google Calendar
 */
export async function getGoogleCalendarEvent(
  accessToken: string,
  eventId: string,
): Promise<GoogleCalendarEventResponse> {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erreur lors de la récupération de l'évènement: ${error}`);
  }

  return response.json();
}
