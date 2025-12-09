import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/email/track/[id] - Tracker l'ouverture d'un email
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Vérifier que le tracking existe
    const emailTracking = await prisma.emailTracking.findUnique({
      where: { id },
    });

    if (!emailTracking) {
      // Retourner une image transparente 1x1 même si le tracking n'existe pas
      return new NextResponse(
        Buffer.from(
          'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
          'base64',
        ),
        {
          status: 200,
          headers: {
            'Content-Type': 'image/gif',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        },
      );
    }

    // Mettre à jour le tracking
    const now = new Date();
    await prisma.emailTracking.update({
      where: { id },
      data: {
        openCount: {
          increment: 1,
        },
        firstOpenedAt: emailTracking.firstOpenedAt || now,
        lastOpenedAt: now,
      },
    });

    // Retourner une image transparente 1x1 pixel (GIF)
    return new NextResponse(
      Buffer.from(
        'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
        'base64',
      ),
      {
        status: 200,
        headers: {
          'Content-Type': 'image/gif',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      },
    );
  } catch (error: any) {
    // Retourner quand même une image transparente pour ne pas casser l'affichage
    return new NextResponse(
      Buffer.from(
        'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
        'base64',
      ),
      {
        status: 200,
        headers: {
          'Content-Type': 'image/gif',
        },
      },
    );
  }
}

