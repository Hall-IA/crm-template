import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/contacts/[id] - Récupérer un contact spécifique avec ses interactions
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

    const contact = await prisma.contact.findUnique({
      where: { id },
      include: {
        status: true,
        assignedCommercial: {
          select: { id: true, name: true, email: true },
        },
        assignedTelepro: {
          select: { id: true, name: true, email: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        interactions: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!contact) {
      return NextResponse.json(
        { error: "Contact non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(contact);
  } catch (error: any) {
    console.error("Erreur lors de la récupération du contact:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// PUT /api/contacts/[id] - Mettre à jour un contact
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
    const {
      civility,
      firstName,
      lastName,
      phone,
      secondaryPhone,
      email,
      address,
      city,
      postalCode,
      origin,
      statusId,
      assignedCommercialId,
      assignedTeleproId,
    } = body;

    // Validation
    if (!phone) {
      return NextResponse.json(
        { error: "Le téléphone est obligatoire" },
        { status: 400 }
      );
    }

    // Vérifier que le contact existe
    const existing = await prisma.contact.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Contact non trouvé" },
        { status: 404 }
      );
    }

    const contact = await prisma.contact.update({
      where: { id },
      data: {
        civility: civility || null,
        firstName: firstName || null,
        lastName: lastName || null,
        phone,
        secondaryPhone: secondaryPhone || null,
        email: email || null,
        address: address || null,
        city: city || null,
        postalCode: postalCode || null,
        origin: origin || null,
        statusId: statusId || null,
        assignedCommercialId: assignedCommercialId || null,
        assignedTeleproId: assignedTeleproId || null,
      },
      include: {
        status: true,
        assignedCommercial: {
          select: { id: true, name: true, email: true },
        },
        assignedTelepro: {
          select: { id: true, name: true, email: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(contact);
  } catch (error: any) {
    console.error("Erreur lors de la mise à jour du contact:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}

// DELETE /api/contacts/[id] - Supprimer un contact
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

    // Vérifier que le contact existe
    const existing = await prisma.contact.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Contact non trouvé" },
        { status: 404 }
      );
    }

    await prisma.contact.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Contact supprimé avec succès" });
  } catch (error: any) {
    console.error("Erreur lors de la suppression du contact:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}

