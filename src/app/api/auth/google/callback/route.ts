import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { exchangeGoogleCodeForTokens } from '@/lib/google-calendar';

/**
 * GET /api/auth/google/callback
 * Gère le callback OAuth de Google et sauvegarde les tokens
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.redirect(new URL('/signin', request.url));
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        new URL(
          `/settings?error=${encodeURIComponent('Erreur lors de la connexion Google')}`,
          request.url,
        ),
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL(
          `/settings?error=${encodeURIComponent("Code d'autorisation manquant")}`,
          request.url,
        ),
      );
    }

    const redirectUri =
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback';
    const tokens = await exchangeGoogleCodeForTokens(code, redirectUri);

    // Calculer la date d'expiration du token
    const tokenExpiresAt = new Date();
    tokenExpiresAt.setSeconds(tokenExpiresAt.getSeconds() + (tokens.expires_in || 3600));

    // Récupérer l'email du compte Google (optionnel, via l'API userinfo)
    let googleEmail: string | null = null;
    try {
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      });
      if (userInfoResponse.ok) {
        const userInfo = await userInfoResponse.json();
        googleEmail = userInfo.email || null;
      }
    } catch (err) {
      console.error("Erreur lors de la récupération de l'email Google:", err);
    }

    // Sauvegarder ou mettre à jour les tokens
    await prisma.userGoogleAccount.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || '',
        tokenExpiresAt,
        email: googleEmail,
      },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || undefined,
        tokenExpiresAt,
        email: googleEmail,
      },
    });

    return NextResponse.redirect(new URL('/settings?success=google_connected', request.url));
  } catch (error: any) {
    console.error('Erreur lors du callback Google:', error);
    return NextResponse.redirect(
      new URL(
        `/settings?error=${encodeURIComponent(error.message || 'Erreur lors de la connexion Google')}`,
        request.url,
      ),
    );
  }
}
