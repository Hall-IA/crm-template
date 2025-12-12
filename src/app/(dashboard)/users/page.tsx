'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, Shield, Key, ArrowLeft } from 'lucide-react';
import { PERMISSIONS, DEFAULT_ROLES } from '@/lib/permissions';

interface Stats {
  activeUsers: number;
  totalUsers: number;
  rolesCount: number;
  permissionsCount: number;
}

export default function AccessControlPage() {
  const [stats, setStats] = useState<Stats>({
    activeUsers: 0,
    totalUsers: 0,
    rolesCount: Object.keys(DEFAULT_ROLES).length,
    permissionsCount: PERMISSIONS.length,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/users');
        if (response.ok) {
          const users = await response.json();
          setStats({
            activeUsers: users.filter((u: { active: boolean }) => u.active).length,
            totalUsers: users.length,
            rolesCount: Object.keys(DEFAULT_ROLES).length,
            permissionsCount: PERMISSIONS.length,
          });
        }
      } catch (error) {
        console.error('Erreur lors du chargement des stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const cards = [
    {
      title: 'Utilisateurs',
      subtitle: 'Gérer les comptes utilisateurs',
      description:
        'Créer, modifier et administrer les utilisateurs du système. Activer ou désactiver les comptes selon les besoins.',
      icon: Users,
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      href: '/users/list',
      stat: loading ? '...' : stats.activeUsers,
      statLabel: 'Utilisateurs actifs',
    },
    {
      title: 'Profils',
      subtitle: 'Définir les rôles',
      description:
        'Créer et configurer les profils utilisateur (Admin, Manager, Compta, etc.) avec leurs descriptions et attributions.',
      icon: Shield,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      href: '/users/roles',
      stat: stats.rolesCount,
      statLabel: 'Profils configurés',
    },
    {
      title: 'Permissions',
      subtitle: 'Configurer les droits',
      description:
        "Assigner les permissions aux profils et contrôler l'accès aux différentes fonctionnalités du système.",
      icon: Key,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      href: '/users/permissions',
      stat: stats.permissionsCount,
      statLabel: 'Permissions disponibles',
    },
  ];

  return (
    <div className="h-full">
      <div className="border-b border-gray-200 bg-white">
        <div className="p-4 sm:p-6">
          <Link
            href="/dashboard"
            className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Droits d'accès</h1>
            <p className="mt-1 text-sm text-gray-500">
              Gérer les utilisateurs, profils et permissions de votre système
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.title}
                href={card.href}
                className="group cursor-pointer rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  <div className={`rounded-lg p-3 ${card.iconBg}`}>
                    <Icon className={`h-6 w-6 ${card.iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600">
                      {card.title}
                    </h3>
                    <p className="text-sm font-medium text-gray-600">{card.subtitle}</p>
                  </div>
                </div>

                <p className="mt-4 text-sm text-gray-600">{card.description}</p>

                <div className="mt-6 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-gray-900">{card.stat}</span>
                  <span className="text-sm text-gray-500">{card.statLabel}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
