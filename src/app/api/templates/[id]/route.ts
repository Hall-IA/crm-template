import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/templates/[id] - Récupérer un template spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;

    const template = await prisma.template.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(template);
  } catch (error: any) {
    console.error("Erreur lors de la récupération du template:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// PUT /api/templates/[id] - Mettre à jour un template
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, type, subject, content } = body;

    // Vérifier que le template existe et appartient à l'utilisateur
    const existing = await prisma.template.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Template non trouvé" },
        { status: 404 }
      );
    }

    // Validation
    if (!name || !type || !content) {
      return NextResponse.json(
        { error: "Le nom, le type et le contenu sont requis" },
        { status: 400 }
      );
    }

    if (!["EMAIL", "SMS", "NOTE"].includes(type)) {
      return NextResponse.json(
        { error: "Type invalide. Doit être EMAIL, SMS ou NOTE" },
        { status: 400 }
      );
    }

    // Pour EMAIL, le sujet est requis
    if (type === "EMAIL" && !subject) {
      return NextResponse.json(
        { error: "Le sujet est requis pour les templates EMAIL" },
        { status: 400 }
      );
    }

    const template = await prisma.template.update({
      where: { id },
      data: {
        name,
        type,
        subject: type === "EMAIL" ? subject : null,
        content,
      },
    });

    return NextResponse.json(template);
  } catch (error: any) {
    console.error("Erreur lors de la mise à jour du template:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}

// DELETE /api/templates/[id] - Supprimer un template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;

    // Vérifier que le template existe et appartient à l'utilisateur
    const existing = await prisma.template.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Template non trouvé" },
        { status: 404 }
      );
    }

    await prisma.template.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Template supprimé avec succès" });
  } catch (error: any) {
    console.error("Erreur lors de la suppression du template:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}

