"use client";

import { useSession } from "@/lib/auth-client";
import { PageHeader } from "@/components/page-header";
import { cn } from "@/lib/utils";

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
      <PageHeader
        title="Tableau de bord"
        description={`Bienvenue, ${session?.user?.name || "Utilisateur"} ! Voici un aperçu de votre activité.`}
      />

      {/* Content */}
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Stats Grid */}
        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2">
          {stats.map((stat) => (
            <div
              key={stat.name}
              className="overflow-hidden rounded-lg bg-white shadow"
            >
              <div className="p-4 sm:p-6">
                <div className="flex items-center">
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg sm:h-12 sm:w-12",
                      stat.color,
                    )}
                  >
                    <span className="text-xl sm:text-2xl">{stat.icon}</span>
                  </div>
                  <div className="ml-3 sm:ml-4 min-w-0">
                    <p className="text-xs font-medium text-gray-600 sm:text-sm">
                      {stat.name}
                    </p>
                    <p className="text-xl font-bold text-gray-900 sm:text-2xl">
                      {stat.value}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="mt-6 sm:mt-8">
          <h2 className="text-base font-semibold text-gray-900 sm:text-lg">
            Activité récente
          </h2>
          <div className="mt-4 space-y-4">
            {recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="rounded-lg bg-white p-4 shadow sm:p-6"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900">
                      {activity.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      {activity.description}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500 shrink-0">{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

