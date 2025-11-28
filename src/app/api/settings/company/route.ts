import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/roles';

// GET /api/settings/company - Récupérer les informations de l'entreprise
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request.headers);

    // Récupérer ou créer l'enregistrement de l'entreprise
    let company = await prisma.company.findUnique({
      where: { id: 'company' },
    });

    // Si l'entreprise n'existe pas, la créer
    if (!company) {
      company = await prisma.company.create({
        data: {
          id: 'company',
        },
      });
    }

    return NextResponse.json(company);
  } catch (error: any) {
    console.error("Erreur lors de la récupération des informations de l'entreprise:", error);

    if (error.message === 'Non authentifié') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (error.message === 'Permissions insuffisantes') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PUT /api/settings/company - Mettre à jour les informations de l'entreprise
export async function PUT(request: NextRequest) {
  try {
    await requireAdmin(request.headers);

    const body = await request.json();
    const {
      name,
      address,
      city,
      postalCode,
      country,
      phone,
      email,
      website,
      siret,
      vatNumber,
      logo,
    } = body;

    // Vérifier si l'entreprise existe
    let company = await prisma.company.findUnique({
      where: { id: 'company' },
    });

    // Si l'entreprise n'existe pas, la créer
    if (!company) {
      company = await prisma.company.create({
        data: {
          id: 'company',
          name,
          address,
          city,
          postalCode,
          country,
          phone,
          email,
          website,
          siret,
          vatNumber,
          logo,
        },
      });
    } else {
      // Mettre à jour l'entreprise
      company = await prisma.company.update({
        where: { id: 'company' },
        data: {
          name: name !== undefined ? name : company.name,
          address: address !== undefined ? address : company.address,
          city: city !== undefined ? city : company.city,
          postalCode: postalCode !== undefined ? postalCode : company.postalCode,
          country: country !== undefined ? country : company.country,
          phone: phone !== undefined ? phone : company.phone,
          email: email !== undefined ? email : company.email,
          website: website !== undefined ? website : company.website,
          siret: siret !== undefined ? siret : company.siret,
          vatNumber: vatNumber !== undefined ? vatNumber : company.vatNumber,
          logo: logo !== undefined ? logo : company.logo,
        },
      });
    }

    return NextResponse.json({
      success: true,
      company,
      message: "Informations de l'entreprise mises à jour avec succès",
    });
  } catch (error: any) {
    console.error("Erreur lors de la mise à jour des informations de l'entreprise:", error);

    if (error.message === 'Non authentifié') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (error.message === 'Permissions insuffisantes') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}
