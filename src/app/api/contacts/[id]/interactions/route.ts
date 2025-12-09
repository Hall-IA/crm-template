import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/contacts/[id]/interactions - Récupérer les interactions d'un contact
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { id } = await params;

    // Vérifier que le contact existe
    const contact = await prisma.contact.findUnique({
      where: { id },
    });

    if (!contact) {
      return NextResponse.json({ error: 'Contact non trouvé' }, { status: 404 });
    }

    const interactions = await prisma.interaction.findMany({
      where: { contactId: id },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(interactions);
  } catch (error: any) {
    console.error('Erreur lors de la récupération des interactions:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/contacts/[id]/interactions - Créer une nouvelle interaction
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { type, title, content, date, metadata } = body;

    // Validation
    if (!type || !content) {
      return NextResponse.json({ error: 'Le type et le contenu sont requis' }, { status: 400 });
    }

    // Vérifier que le contact existe
    const contact = await prisma.contact.findUnique({
      where: { id },
    });

    if (!contact) {
      return NextResponse.json({ error: 'Contact non trouvé' }, { status: 404 });
    }

    const interaction = await prisma.interaction.create({
      data: {
        contactId: id,
        type,
        title: title || null,
        content,
        date: date ? new Date(date) : null,
        userId: session.user.id,
        metadata: metadata || undefined,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(interaction, { status: 201 });
  } catch (error: any) {
    console.error("Erreur lors de la création de l'interaction:", error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}
