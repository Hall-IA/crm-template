import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logStatusChange, logContactUpdate, logAssignmentChange } from '@/lib/contact-interactions';

// GET /api/contacts/[id] - Récupérer un contact spécifique avec ses interactions
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { id } = await params;

    const contact = await prisma.contact.findUnique({
      where: { id },
      include: {
        status: true,
        companyRelation: {
          select: { id: true, firstName: true, lastName: true, isCompany: true },
        },
        contacts: {
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
        interactions: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!contact) {
      return NextResponse.json({ error: 'Contact non trouvé' }, { status: 404 });
    }

    return NextResponse.json(contact);
  } catch (error: any) {
    console.error('Erreur lors de la récupération du contact:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PUT /api/contacts/[id] - Mettre à jour un contact
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
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

    // Vérifier que le contact existe avec toutes les relations nécessaires
    const existing = await prisma.contact.findUnique({
      where: { id },
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
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Contact non trouvé' }, { status: 404 });
    }

    // Préparer les données de mise à jour
    const updateData: any = {
      civility: civility !== undefined ? civility || null : existing.civility,
      firstName: firstName !== undefined ? firstName || null : existing.firstName,
      lastName: lastName !== undefined ? lastName || null : existing.lastName,
      phone: phone || existing.phone,
      secondaryPhone:
        secondaryPhone !== undefined ? secondaryPhone || null : existing.secondaryPhone,
      email: email !== undefined ? email || null : existing.email,
      address: address !== undefined ? address || null : existing.address,
      city: city !== undefined ? city || null : existing.city,
      postalCode: postalCode !== undefined ? postalCode || null : existing.postalCode,
      origin: origin !== undefined ? origin || null : existing.origin,
      companyName: companyName !== undefined ? companyName || null : existing.companyName,
      isCompany: isCompany !== undefined ? isCompany === true : existing.isCompany,
      companyId: companyId !== undefined ? companyId || null : existing.companyId,
      statusId: statusId !== undefined ? statusId || null : existing.statusId,
      assignedCommercialId:
        assignedCommercialId !== undefined
          ? assignedCommercialId || null
          : existing.assignedCommercialId,
      assignedTeleproId:
        assignedTeleproId !== undefined ? assignedTeleproId || null : existing.assignedTeleproId,
    };

    // Détecter les changements pour créer les interactions
    const changes: Record<string, { old: any; new: any }> = {};

    // Changements de champs de contact
    if (civility !== undefined && civility !== existing.civility) {
      changes.civility = { old: existing.civility, new: civility };
    }
    if (firstName !== undefined && firstName !== existing.firstName) {
      changes.firstName = { old: existing.firstName, new: firstName };
    }
    if (lastName !== undefined && lastName !== existing.lastName) {
      changes.lastName = { old: existing.lastName, new: lastName };
    }
    if (phone !== undefined && phone !== existing.phone) {
      changes.phone = { old: existing.phone, new: phone };
    }
    if (secondaryPhone !== undefined && secondaryPhone !== existing.secondaryPhone) {
      changes.secondaryPhone = { old: existing.secondaryPhone, new: secondaryPhone };
    }
    if (email !== undefined && email !== existing.email) {
      changes.email = { old: existing.email, new: email };
    }
    if (address !== undefined && address !== existing.address) {
      changes.address = { old: existing.address, new: address };
    }
    if (city !== undefined && city !== existing.city) {
      changes.city = { old: existing.city, new: city };
    }
    if (postalCode !== undefined && postalCode !== existing.postalCode) {
      changes.postalCode = { old: existing.postalCode, new: postalCode };
    }
    if (origin !== undefined && origin !== existing.origin) {
      changes.origin = { old: existing.origin, new: origin };
    }
    if (companyName !== undefined && companyName !== existing.companyName) {
      changes.companyName = { old: existing.companyName, new: companyName };
    }

    // Mettre à jour le contact
    const contact = await prisma.contact.update({
      where: { id },
      data: updateData,
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

    // Créer les interactions pour les changements détectés
    try {
      // Changement de statut
      if (statusId !== undefined && statusId !== existing.statusId) {
        await logStatusChange(
          id,
          existing.statusId,
          statusId,
          session.user.id,
          existing.status?.name || null,
          contact.status?.name || null,
        );
      }

      // Changement d'assignation Commercial
      // Normaliser les valeurs pour la comparaison (null, undefined, '' sont considérés comme équivalents)
      const normalizedExistingCommercial = existing.assignedCommercialId || null;
      const normalizedNewCommercial = assignedCommercialId || null;
      
      if (
        assignedCommercialId !== undefined &&
        normalizedExistingCommercial !== normalizedNewCommercial
      ) {
        await logAssignmentChange(
          id,
          'COMMERCIAL',
          existing.assignedCommercialId,
          assignedCommercialId,
          session.user.id,
          existing.assignedCommercial?.name || null,
          contact.assignedCommercial?.name || null,
        );
      }

      // Changement d'assignation Télépro
      // Normaliser les valeurs pour la comparaison (null, undefined, '' sont considérés comme équivalents)
      const normalizedExistingTelepro = existing.assignedTeleproId || null;
      const normalizedNewTelepro = assignedTeleproId || null;
      
      if (
        assignedTeleproId !== undefined &&
        normalizedExistingTelepro !== normalizedNewTelepro
      ) {
        await logAssignmentChange(
          id,
          'TELEPRO',
          existing.assignedTeleproId,
          assignedTeleproId,
          session.user.id,
          existing.assignedTelepro?.name || null,
          contact.assignedTelepro?.name || null,
        );
      }

      // Changements de champs de contact
      if (Object.keys(changes).length > 0) {
        await logContactUpdate(id, changes, session.user.id);
      }
    } catch (error) {
      // Ne pas faire échouer la mise à jour si l'enregistrement de l'interaction échoue
      console.error('Erreur lors de la création des interactions:', error);
    }

    return NextResponse.json(contact);
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour du contact:', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/contacts/[id] - Supprimer un contact
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Vérifier que l'utilisateur est administrateur
    const { requireAdmin } = await import('@/lib/roles');
    await requireAdmin(request.headers);

    const { id } = await params;

    // Vérifier que le contact existe
    const existing = await prisma.contact.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Contact non trouvé' }, { status: 404 });
    }

    await prisma.contact.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Contact supprimé avec succès' });
  } catch (error: any) {
    console.error('Erreur lors de la suppression du contact:', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}
