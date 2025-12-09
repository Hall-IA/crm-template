import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/statuses - Récupérer tous les statuts (accessible à tous les utilisateurs authentifiés)
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const statuses = await prisma.status.findMany({
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(statuses);
  } catch (error: any) {
    console.error('Erreur lors de la récupération des statuts:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
