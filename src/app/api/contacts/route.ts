import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/contacts - Récupérer tous les contacts avec filtres
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const statusId = searchParams.get("statusId");
    const assignedUserId = searchParams.get("assignedUserId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    // Construire les filtres
    const where: any = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    if (statusId) {
      where.statusId = statusId;
    }

    if (assignedUserId) {
      where.assignedUserId = assignedUserId;
    }

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        include: {
          status: true,
          assignedUser: {
            select: { id: true, name: true, email: true },
          },
          createdBy: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.contact.count({ where }),
    ]);

    return NextResponse.json({
      contacts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Erreur lors de la récupération des contacts:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// POST /api/contacts - Créer un nouveau contact
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

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
      assignedUserId,
    } = body;

    // Validation
    if (!phone) {
      return NextResponse.json(
        { error: "Le téléphone est obligatoire" },
        { status: 400 }
      );
    }

    // Par défaut, assigner à l'utilisateur qui crée le contact
    const finalAssignedUserId = assignedUserId || session.user.id;

    const contact = await prisma.contact.create({
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
        assignedUserId: finalAssignedUserId,
        createdById: session.user.id,
        interactions: {
          create: {
            type: "NOTE",
            title: "Contact créé",
            content: `Contact créé le ${new Date().toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}`,
            userId: session.user.id,
            date: new Date(),
          },
        },
      },
      include: {
        status: true,
        assignedUser: {
          select: { id: true, name: true, email: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(contact, { status: 201 });
  } catch (error: any) {
    console.error("Erreur lors de la création du contact:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}

