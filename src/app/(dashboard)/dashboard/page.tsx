'use client';

import { useEffect, useState } from 'react';
import { Users, CheckCircle2, Clock, TrendingUp } from 'lucide-react';
import { StatCard } from '@/components/dashboard/stat-card';
import { ContactsChart } from '@/components/dashboard/contacts-chart';
import { StatusDistributionChart } from '@/components/dashboard/status-distribution-chart';
import { ActivityChart } from '@/components/dashboard/activity-chart';
import { TasksPieChart } from '@/components/dashboard/tasks-pie-chart';
import { UpcomingTasksList } from '@/components/dashboard/upcoming-tasks-list';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { TopContactsList } from '@/components/dashboard/top-contacts-list';
import { PageHeader } from '@/components/page-header';

interface DashboardStats {
  overview: {
    totalContacts: number;
    contactsThisMonth: number;
    contactsGrowth: number;
    monthsData: Array<{ month: string; count: number }>;
  };
  statusDistribution: Array<{ name: string; value: number }>;
  tasks: {
    total: number;
    completed: number;
    pending: number;
    upcoming: Array<{
      id: string;
      title: string;
      type: string;
      scheduledAt: string;
      contact: { id: string; name: string } | null;
      priority: string;
    }>;
    byType: Array<{ type: string; count: number }>;
  };
  interactions: {
    recent: Array<{
      id: string;
      type: string;
      title: string | null;
      content: string;
      date: string;
      contact: {
        id: string;
        name: string;
      };
    }>;
    byType: Array<{ type: string; count: number }>;
  };
  activity: {
    last7Days: Array<{ date: string; interactions: number; tasks: number }>;
  };
  topContacts: Array<{
    id: string;
    name: string;
    phone: string;
    email: string | null;
    status: string;
    interactionsCount: number;
    assignedCommercial?: string;
    assignedTelepro?: string;
  }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/dashboard/stats');
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des statistiques');
        }
        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="h-full">
        <PageHeader title="Tableau de Bord" description="Vue d'ensemble de votre activité" />
        <div className="p-4 sm:p-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-lg bg-gray-200" />
            ))}
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-96 animate-pulse rounded-lg bg-gray-200" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="h-full">
        <PageHeader title="Tableau de Bord" description="Vue d'ensemble de votre activité" />
        <div className="flex h-96 items-center justify-center p-4 sm:p-6">
          <div className="text-center">
            <p className="text-red-600">{error || 'Erreur de chargement'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <PageHeader title="Tableau de Bord" description="Vue d'ensemble de votre activité" />

      <div className="space-y-6 p-4 sm:p-6">
        {/* Statistiques principales */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Contacts"
            value={stats.overview.totalContacts.toLocaleString('fr-FR')}
            icon={Users}
            trend={{
              value: stats.overview.contactsGrowth,
              label: 'ce mois',
            }}
            iconColor="text-indigo-600"
            iconBgColor="bg-indigo-100"
          />
          <StatCard
            title="Nouveaux ce Mois"
            value={stats.overview.contactsThisMonth.toLocaleString('fr-FR')}
            icon={TrendingUp}
            iconColor="text-green-600"
            iconBgColor="bg-green-100"
          />
          <StatCard
            title="Tâches Complétées"
            value={stats.tasks.completed.toLocaleString('fr-FR')}
            icon={CheckCircle2}
            iconColor="text-emerald-600"
            iconBgColor="bg-emerald-100"
          />
          <StatCard
            title="Tâches en Attente"
            value={stats.tasks.pending.toLocaleString('fr-FR')}
            icon={Clock}
            iconColor="text-amber-600"
            iconBgColor="bg-amber-100"
          />
        </div>

        {/* Graphiques principaux */}
        <div className="grid gap-6 lg:grid-cols-2">
          <ContactsChart data={stats.overview.monthsData} />
          <StatusDistributionChart data={stats.statusDistribution} />
        </div>

        {/* Graphiques secondaires */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ActivityChart data={stats.activity.last7Days} />
          </div>
          <TasksPieChart completed={stats.tasks.completed} pending={stats.tasks.pending} />
        </div>

        {/* Listes et activités */}
        <div className="grid gap-6 lg:grid-cols-2">
          <UpcomingTasksList tasks={stats.tasks.upcoming} />
          <RecentActivity interactions={stats.interactions.recent} />
        </div>

        {/* Top contacts */}
        <TopContactsList contacts={stats.topContacts} />
      </div>
    </div>
  );
}
