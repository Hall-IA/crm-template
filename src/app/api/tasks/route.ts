import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/tasks - Récupérer les tâches de l'utilisateur
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const assignedTo = searchParams.get('assignedTo'); // Pour les admins
    const contactId = searchParams.get('contactId'); // Filtrer par contact

    // Construire les filtres
    const where: any = {
      scheduledAt: {
        gte: startDate ? new Date(startDate) : new Date(),
        lte: endDate ? new Date(endDate) : undefined,
      },
    };

    // Filtrer par contact si fourni
    if (contactId) {
      where.contactId = contactId;
    }

    // Si admin demande les tâches d'un autre utilisateur
    if (assignedTo && assignedTo !== session.user.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      });
      if (user?.role === 'ADMIN') {
        where.assignedUserId = assignedTo;
      } else {
        // Non-admin ne peut voir que ses propres tâches
        where.assignedUserId = session.user.id;
      }
    } else {
      // Par défaut, voir ses propres tâches
      where.assignedUserId = session.user.id;
    }

    if (!endDate) {
      delete where.scheduledAt.lte;
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        scheduledAt: 'asc',
      },
    });

    return NextResponse.json(tasks);
  } catch (error: any) {
    console.error('Erreur lors de la récupération des tâches:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST /api/tasks - Créer une nouvelle tâche
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
      type,
      title,
      description,
      priority,
      scheduledAt,
      contactId,
      assignedUserId,
      reminderMinutesBefore,
    } = body;

    // Validation
    if (!type || !description || !scheduledAt) {
      return NextResponse.json(
        { error: 'Le type, la description et la date sont requis' },
        { status: 400 }
      );
    }

    // Vérifier si l'utilisateur est admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    // Déterminer l'utilisateur assigné
    let finalAssignedUserId: string;
    if (assignedUserId && user?.role === 'ADMIN') {
      // Admin peut assigner à n'importe qui
      finalAssignedUserId = assignedUserId;
    } else {
      // Utilisateur normal s'assigne automatiquement
      finalAssignedUserId = session.user.id;
    }

    // Vérifier que le contact existe si fourni
    if (contactId) {
      const contact = await prisma.contact.findUnique({
        where: { id: contactId },
      });
      if (!contact) {
        return NextResponse.json(
          { error: 'Contact non trouvé' },
          { status: 404 }
        );
      }
    }

    // Créer la tâche
    const task = await prisma.task.create({
      data: {
        type,
        title: title || null,
        description,
        priority: priority || 'MEDIUM',
        scheduledAt: new Date(scheduledAt),
        contactId: contactId || null,
        assignedUserId: finalAssignedUserId,
        createdById: session.user.id,
        reminderMinutesBefore:
          typeof reminderMinutesBefore === 'number' ? reminderMinutesBefore : null,
      },
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Si la tâche est liée à un contact, créer aussi une interaction
    if (contactId) {
      const interactionTypeMap: Record<string, string> = {
        CALL: 'CALL',
        MEETING: 'MEETING',
        EMAIL: 'EMAIL',
        OTHER: 'NOTE',
      };

      await prisma.interaction.create({
        data: {
          contactId,
          type: (interactionTypeMap[type] || 'NOTE') as any,
          title: title || `Tâche ${type}`,
          content: description,
          userId: session.user.id,
          date: new Date(scheduledAt),
        },
      });
    }

    return NextResponse.json(task, { status: 201 });
  } catch (error: any) {
    console.error('Erreur lors de la création de la tâche:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}

