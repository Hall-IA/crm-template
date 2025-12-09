import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getValidAccessToken, getGoogleCalendarEvent } from '@/lib/google-calendar';

// GET /api/tasks/[id]/attendees - Récupérer les invités d'un Google Meet
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { id } = await params;

    const task = await prisma.task.findUnique({
      where: { id },
      select: {
        id: true,
        googleEventId: true,
        contactId: true,
        contact: {
          select: {
            email: true,
          },
        },
        assignedUserId: true,
      },
    });

    if (!task || !task.googleEventId) {
      return NextResponse.json({ error: 'Tâche ou Google Event non trouvé' }, { status: 404 });
    }

    // Vérifier les permissions
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (task.assignedUserId !== session.user.id && user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Récupérer le compte Google
    const googleAccount = await prisma.userGoogleAccount.findUnique({
      where: { userId: session.user.id },
    });

    if (!googleAccount) {
      return NextResponse.json({ error: 'Compte Google non connecté' }, { status: 400 });
    }

    // Obtenir un token valide
    const accessToken = await getValidAccessToken(
      googleAccount.accessToken,
      googleAccount.refreshToken,
      googleAccount.tokenExpiresAt,
    );

    // Récupérer l'événement Google Calendar
    const googleEvent = await getGoogleCalendarEvent(accessToken, task.googleEventId);

    // Extraire les emails des invités (inclure tous les invités, y compris le contact)
    const attendees =
      googleEvent.attendees?.map((attendee) => attendee.email).filter(Boolean) || [];

    return NextResponse.json({ attendees });
  } catch (error: any) {
    console.error('Erreur lors de la récupération des invités:', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}
