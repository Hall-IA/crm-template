import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { handleContactDuplicate } from '@/lib/contact-duplicate';

// GET /api/contacts - Récupérer tous les contacts avec filtres
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const statusId = searchParams.get('statusId');
    const assignedCommercialId = searchParams.get('assignedCommercialId');
    const assignedTeleproId = searchParams.get('assignedTeleproId');
    // const isCompany = searchParams.get('isCompany');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Construire les filtres
    const where: any = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (statusId) {
      where.statusId = statusId;
    }

    if (assignedCommercialId) {
      where.assignedCommercialId = assignedCommercialId;
    }

    if (assignedTeleproId) {
      where.assignedTeleproId = assignedTeleproId;
    }

    // if (isCompany === 'true') {
    //   where.isCompany = true;
    // }

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where: {
          ...where,
          isCompany: false,
        },
        include: {
          status: true,
          companyRelation: {
            select: { id: true, firstName: true, lastName: true, isCompany: true },
          },
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
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.contact.count({ where: { ...where, isCompany: false } }),
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
    console.error('Erreur lors de la récupération des contacts:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/contacts - Créer un nouveau contact
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
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
      companyName,
      isCompany,
      companyId,
      statusId,
      assignedCommercialId,
      assignedTeleproId,
    } = body;

    // Validation
    if (!phone) {
      return NextResponse.json({ error: 'Le téléphone est obligatoire' }, { status: 400 });
    }

    // Vérifier si c'est un doublon (nom, prénom ET email)
    const duplicateContactId = await handleContactDuplicate(
      firstName,
      lastName,
      email,
      origin || 'Création manuelle',
      session.user.id,
    );

    // Si c'est un doublon, retourner le contact existant
    if (duplicateContactId) {
      const existingContact = await prisma.contact.findUnique({
        where: { id: duplicateContactId },
        include: {
          status: true,
          companyRelation: {
            select: { id: true, firstName: true, lastName: true, isCompany: true },
          },
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
      return NextResponse.json(existingContact, { status: 200 });
    }

    // Sinon, créer un nouveau contact
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
        companyName: companyName || null,
        isCompany: isCompany === true,
        companyId: companyId || null,
        statusId: statusId || null,
        assignedCommercialId: assignedCommercialId || null,
        assignedTeleproId: assignedTeleproId || null,
        createdById: session.user.id,
        interactions: {
          create: {
            type: 'NOTE',
            title: 'Contact créé',
            content: `Contact créé le ${new Date().toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}`,
            userId: session.user.id,
            date: new Date(),
          },
        },
      },
      include: {
        status: true,
        companyRelation: {
          select: { id: true, firstName: true, lastName: true, isCompany: true },
        },
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

    return NextResponse.json(contact, { status: 201 });
  } catch (error: any) {
    console.error('Erreur lors de la création du contact:', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}
