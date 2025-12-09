import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/templates - Récupérer tous les templates de l'utilisateur
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // EMAIL, SMS, NOTE

    const where: any = {
      userId: session.user.id,
    };

    if (type) {
      where.type = type;
    }

    const templates = await prisma.template.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(templates);
  } catch (error: any) {
    console.error('Erreur lors de la récupération des templates:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/templates - Créer un nouveau template
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const { name, type, subject, content } = body;

    // Validation
    if (!name || !type || !content) {
      return NextResponse.json(
        { error: 'Le nom, le type et le contenu sont requis' },
        { status: 400 },
      );
    }

    if (!['EMAIL', 'SMS', 'NOTE'].includes(type)) {
      return NextResponse.json(
        { error: 'Type invalide. Doit être EMAIL, SMS ou NOTE' },
        { status: 400 },
      );
    }

    // Pour EMAIL, le sujet est requis
    if (type === 'EMAIL' && !subject) {
      return NextResponse.json(
        { error: 'Le sujet est requis pour les templates EMAIL' },
        { status: 400 },
      );
    }

    const template = await prisma.template.create({
      data: {
        name,
        type,
        subject: type === 'EMAIL' ? subject : null,
        content,
        userId: session.user.id,
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error: any) {
    console.error('Erreur lors de la création du template:', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}
