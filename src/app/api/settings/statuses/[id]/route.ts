import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/roles";

// PUT /api/settings/statuses/[id] - Mettre à jour un statut
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request.headers);
    const { id } = await params;

    const body = await request.json();
    const { name, color, order } = body;

    // Validation
    if (!name || !color) {
      return NextResponse.json(
        { error: "Le nom et la couleur sont requis" },
        { status: 400 }
      );
    }

    // Vérifier si le statut existe
    const existing = await prisma.status.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Statut non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier si le nom existe déjà pour un autre statut
    const nameConflict = await prisma.status.findFirst({
      where: {
        name,
        NOT: { id },
      },
    });

    if (nameConflict) {
      return NextResponse.json(
        { error: "Un statut avec ce nom existe déjà" },
        { status: 400 }
      );
    }

    const updatedStatus = await prisma.status.update({
      where: { id },
      data: {
        name,
        color,
        ...(order !== undefined && { order }),
      },
    });

    return NextResponse.json(updatedStatus);
  } catch (error: any) {
    console.error("Erreur lors de la mise à jour du statut:", error);
    
    if (error.message === "Non authentifié") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    
    if (error.message === "Permissions insuffisantes") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
    
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}

// DELETE /api/settings/statuses/[id] - Supprimer un statut
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request.headers);
    const { id } = await params;

    // Vérifier si le statut existe
    const existing = await prisma.status.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Statut non trouvé" },
        { status: 404 }
      );
    }

    await prisma.status.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Statut supprimé avec succès" });
  } catch (error: any) {
    console.error("Erreur lors de la suppression du statut:", error);
    
    if (error.message === "Non authentifié") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    
    if (error.message === "Permissions insuffisantes") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
    
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}

