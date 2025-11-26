"use client";

import { useSession } from "@/lib/auth-client";

export default function DashboardPage() {
  const { data: session } = useSession();

  const stats = [
    { name: "Contacts", value: "0", icon: "👥", color: "bg-blue-500" },
    { name: "Revenus", value: "0 €", icon: "💰", color: "bg-yellow-500" },
  ];

  const recentActivities = [
    {
      id: 1,
      title: "Bienvenue sur votre CRM !",
      description: "Commencez par ajouter vos premiers contacts.",
      time: "Maintenant",
    },
  ];

  return (
    <div className="h-full">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-8 py-6">
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="mt-1 text-sm text-gray-600">
          Bienvenue, {session?.user?.name || "Utilisateur"} ! Voici un aperçu de
          votre activité.
        </p>
      </div>

      {/* Content */}
      <div className="p-8">
        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {stats.map((stat) => (
            <div
              key={stat.name}
              className="overflow-hidden rounded-lg bg-white shadow"
            >
              <div className="p-6">
                <div className="flex items-center">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.color}`}
                  >
                    <span className="text-2xl">{stat.icon}</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      {stat.name}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900">
            Activité récente
          </h2>
          <div className="mt-4 space-y-4">
            {recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="rounded-lg bg-white p-6 shadow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {activity.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      {activity.description}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Welcome Card */}
        <div className="mt-8 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 p-8 text-white shadow-lg">
          <h2 className="text-2xl font-bold">🎉 Votre CRM est prêt !</h2>
          <p className="mt-2 text-indigo-100">
            Votre système d'authentification avec Better Auth et Prisma est
            configuré et fonctionnel. Vous pouvez maintenant commencer à
            développer vos fonctionnalités CRM.
          </p>
          <div className="mt-6 flex gap-4">
            <button className="rounded-lg bg-white px-6 py-2 font-medium text-indigo-600 transition-colors hover:bg-indigo-50">
              Ajouter un contact
            </button>
            <button className="rounded-lg border border-white px-6 py-2 font-medium text-white transition-colors hover:bg-white/10">
              Explorer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

