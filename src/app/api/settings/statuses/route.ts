import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/roles";

// GET /api/settings/statuses - Récupérer tous les statuts
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request.headers);

    const statuses = await prisma.status.findMany({
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(statuses);
  } catch (error: any) {
    console.error("Erreur lors de la récupération des statuts:", error);
    
    if (error.message === "Non authentifié") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    
    if (error.message === "Permissions insuffisantes") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
    
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// POST /api/settings/statuses - Créer un nouveau statut
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request.headers);

    const body = await request.json();
    const { name, color, order } = body;

    // Validation
    if (!name || !color) {
      return NextResponse.json(
        { error: "Le nom et la couleur sont requis" },
        { status: 400 }
      );
    }

    // Vérifier si le nom existe déjà
    const existing = await prisma.status.findUnique({
      where: { name },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Un statut avec ce nom existe déjà" },
        { status: 400 }
      );
    }

    // Récupérer le dernier ordre si non fourni
    let statusOrder = order;
    if (statusOrder === undefined || statusOrder === null) {
      const lastStatus = await prisma.status.findFirst({
        orderBy: { order: 'desc' },
      });
      statusOrder = lastStatus ? lastStatus.order + 1 : 0;
    }

    const status = await prisma.status.create({
      data: {
        name,
        color,
        order: statusOrder,
      },
    });

    return NextResponse.json(status, { status: 201 });
  } catch (error: any) {
    console.error("Erreur lors de la création du statut:", error);
    
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

