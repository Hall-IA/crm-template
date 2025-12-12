import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userId = session.user.id;
    const userRole = session.user.role;

    // Déterminer les contacts visibles selon le rôle
    const contactFilter =
      userRole === 'ADMIN'
        ? {}
        : userRole === 'MANAGER'
          ? {}
          : userRole === 'COMMERCIAL'
            ? { assignedCommercialId: userId }
            : userRole === 'TELEPRO'
              ? { assignedTeleproId: userId }
              : { createdById: userId };

    // 1. Total des contacts
    const totalContacts = await prisma.contact.count({
      where: contactFilter,
    });

    // 2. Contacts créés ce mois
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const contactsThisMonth = await prisma.contact.count({
      where: {
        ...contactFilter,
        createdAt: { gte: startOfMonth },
      },
    });

    const lastMonthStart = new Date(startOfMonth);
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);

    const contactsLastMonth = await prisma.contact.count({
      where: {
        ...contactFilter,
        createdAt: {
          gte: lastMonthStart,
          lt: startOfMonth,
        },
      },
    });

    const contactsGrowth =
      contactsLastMonth > 0
        ? ((contactsThisMonth - contactsLastMonth) / contactsLastMonth) * 100
        : 0;

    // 3. Contacts par mois (12 derniers mois)
    const monthsData = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);

      const count = await prisma.contact.count({
        where: {
          ...contactFilter,
          createdAt: {
            gte: monthStart,
            lt: monthEnd,
          },
        },
      });

      monthsData.push({
        month: monthStart.toLocaleString('fr-FR', { month: 'short' }),
        count,
      });
    }

    // 4. Répartition par statut (pour le radar chart)
    const statusDistribution = await prisma.contact.groupBy({
      by: ['statusId'],
      where: contactFilter,
      _count: true,
    });

    const statuses = await prisma.status.findMany();
    const statusData = statuses.map((status) => ({
      name: status.name,
      value: statusDistribution.find((s) => s.statusId === status.id)?._count || 0,
    }));

    // 5. Tâches à venir (Top tasks)
    const upcomingTasks = await prisma.task.findMany({
      where: {
        assignedUserId: userId,
        completed: false,
        scheduledAt: { gte: new Date() },
      },
      include: {
        contact: true,
        assignedUser: true,
      },
      orderBy: { scheduledAt: 'asc' },
      take: 6,
    });

    // 6. Interactions récentes
    const recentInteractions = await prisma.interaction.findMany({
      where: {
        userId,
      },
      include: {
        contact: true,
        user: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // 7. Statistiques des tâches
    const totalTasks = await prisma.task.count({
      where: { assignedUserId: userId },
    });

    const completedTasks = await prisma.task.count({
      where: {
        assignedUserId: userId,
        completed: true,
      },
    });

    const pendingTasks = totalTasks - completedTasks;

    // 8. Tâches par type ce mois
    const tasksThisMonthByType = await prisma.task.groupBy({
      by: ['type'],
      where: {
        assignedUserId: userId,
        createdAt: { gte: startOfMonth },
      },
      _count: true,
    });

    const tasksByType = tasksThisMonthByType.map((t) => ({
      type: t.type,
      count: t._count,
    }));

    // 9. Interactions par type ce mois
    const interactionsThisMonth = await prisma.interaction.groupBy({
      by: ['type'],
      where: {
        userId,
        createdAt: { gte: startOfMonth },
      },
      _count: true,
    });

    const interactionsByType = interactionsThisMonth.map((i) => ({
      type: i.type,
      count: i._count,
    }));

    // 10. Activité des 7 derniers jours
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date();
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const interactionsCount = await prisma.interaction.count({
        where: {
          userId,
          createdAt: {
            gte: dayStart,
            lt: dayEnd,
          },
        },
      });

      const tasksCount = await prisma.task.count({
        where: {
          assignedUserId: userId,
          createdAt: {
            gte: dayStart,
            lt: dayEnd,
          },
        },
      });

      last7Days.push({
        date: dayStart.toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'short',
        }),
        interactions: interactionsCount,
        tasks: tasksCount,
      });
    }

    // 11. Top contacts (ceux avec le plus d'interactions)
    const topContacts = await prisma.contact.findMany({
      where: contactFilter,
      include: {
        _count: {
          select: { interactions: true },
        },
        status: true,
        assignedCommercial: true,
        assignedTelepro: true,
      },
      orderBy: {
        interactions: {
          _count: 'desc',
        },
      },
      take: 5,
    });

    return NextResponse.json({
      overview: {
        totalContacts,
        contactsThisMonth,
        contactsGrowth: Math.round(contactsGrowth * 10) / 10,
        monthsData,
      },
      statusDistribution: statusData,
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        pending: pendingTasks,
        upcoming: upcomingTasks.map((task) => ({
          id: task.id,
          title: task.title || 'Sans titre',
          description: task.description,
          type: task.type,
          scheduledAt: task.scheduledAt,
          contact: task.contact
            ? {
                id: task.contact.id,
                name:
                  `${task.contact.firstName || ''} ${task.contact.lastName || ''}`.trim() ||
                  task.contact.phone,
              }
            : null,
          priority: task.priority,
        })),
        byType: tasksByType,
      },
      interactions: {
        recent: recentInteractions.map((interaction) => ({
          id: interaction.id,
          type: interaction.type,
          title: interaction.title,
          content: interaction.content,
          date: interaction.date || interaction.createdAt,
          contact: {
            id: interaction.contact.id,
            name:
              `${interaction.contact.firstName || ''} ${interaction.contact.lastName || ''}`.trim() ||
              interaction.contact.phone,
          },
        })),
        byType: interactionsByType,
      },
      activity: {
        last7Days,
      },
      topContacts: topContacts.map((contact) => ({
        id: contact.id,
        name: `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || contact.phone,
        phone: contact.phone,
        email: contact.email,
        status: contact.status?.name || 'Non défini',
        interactionsCount: contact._count.interactions,
        assignedCommercial: contact.assignedCommercial?.name,
        assignedTelepro: contact.assignedTelepro?.name,
      })),
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
