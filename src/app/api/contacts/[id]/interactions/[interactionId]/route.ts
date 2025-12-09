import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PUT /api/contacts/[id]/interactions/[interactionId] - Mettre à jour une interaction
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; interactionId: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { interactionId } = await params;
    const body = await request.json();
    const { type, title, content, date } = body;

    // Vérifier que l'interaction existe
    const existing = await prisma.interaction.findUnique({
      where: { id: interactionId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Interaction non trouvée' }, { status: 404 });
    }

    const interaction = await prisma.interaction.update({
      where: { id: interactionId },
      data: {
        type: type || existing.type,
        title: title !== undefined ? title : existing.title,
        content: content || existing.content,
        date: date ? new Date(date) : existing.date,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(interaction);
  } catch (error: any) {
    console.error("Erreur lors de la mise à jour de l'interaction:", error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/contacts/[id]/interactions/[interactionId] - Supprimer une interaction
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; interactionId: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { interactionId } = await params;

    // Vérifier que l'interaction existe
    const existing = await prisma.interaction.findUnique({
      where: { id: interactionId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Interaction non trouvée' }, { status: 404 });
    }

    await prisma.interaction.delete({
      where: { id: interactionId },
    });

    return NextResponse.json({
      success: true,
      message: 'Interaction supprimée avec succès',
    });
  } catch (error: any) {
    console.error("Erreur lors de la suppression de l'interaction:", error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}
