/**
 * Composants Skeleton pour les états de chargement
 */

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded bg-gray-200 ${className}`} aria-label="Chargement..." />
  );
}

export function ContactTableSkeleton({ isAdmin = false }: { isAdmin?: boolean }) {
  return (
    <div className="overflow-x-auto rounded-lg bg-white shadow">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase sm:px-6">
              Contact
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase sm:px-6">
              Téléphone
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase sm:px-6">
              Email
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase sm:px-6">
              Statut
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase sm:px-6">
              COMMERCIAL
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase sm:px-6">
              TÉLÉPRO
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase sm:px-6">
              Créé le
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase sm:px-6">
              Modifié le
            </th>
            {isAdmin && (
              <th className="px-3 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase sm:px-6">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {Array.from({ length: 8 }).map((_, i) => (
            <tr key={i} className="hover:bg-gray-50">
              <td className="px-3 py-4 whitespace-nowrap sm:px-6">
                <div className="flex items-center">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="ml-3 space-y-2 sm:ml-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </td>
              <td className="px-3 py-4 whitespace-nowrap sm:px-6">
                <Skeleton className="h-4 w-28" />
              </td>
              <td className="px-3 py-4 whitespace-nowrap sm:px-6">
                <Skeleton className="h-4 w-40" />
              </td>
              <td className="px-3 py-4 whitespace-nowrap sm:px-6">
                <Skeleton className="h-6 w-20 rounded-full" />
              </td>
              <td className="px-3 py-4 whitespace-nowrap sm:px-6">
                <Skeleton className="h-5 w-24 rounded-full" />
              </td>
              <td className="px-3 py-4 whitespace-nowrap sm:px-6">
                <Skeleton className="h-5 w-24 rounded-full" />
              </td>
              <td className="px-3 py-4 whitespace-nowrap sm:px-6">
                <Skeleton className="h-4 w-32" />
              </td>
              <td className="px-3 py-4 whitespace-nowrap sm:px-6">
                <Skeleton className="h-4 w-32" />
              </td>
              {isAdmin && (
                <td className="px-3 py-4 text-right text-sm font-medium whitespace-nowrap sm:px-6">
                  <div className="flex items-center justify-end gap-2">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ContactCardsSkeleton({ isAdmin = false }: { isAdmin?: boolean }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 9 }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
        >
          {/* En-tête */}
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </div>

          {/* Informations de contact */}
          <div className="mb-4 space-y-2">
            <div className="flex items-center">
              <Skeleton className="mr-2 h-4 w-4" />
              <Skeleton className="h-4 w-28" />
            </div>
            <div className="flex items-center">
              <Skeleton className="mr-2 h-4 w-4" />
              <Skeleton className="h-4 w-36" />
            </div>
            <div className="flex items-center">
              <Skeleton className="mr-2 h-4 w-4" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>

          {/* Badge statut */}
          <div className="mb-4">
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>

          {/* Pied de carte avec utilisateurs assignés */}
          <div className="flex items-start justify-between border-t border-gray-100 pt-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-7 w-7 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-7 w-7 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            </div>

            {/* Actions */}
            {isAdmin && (
              <div className="flex items-center justify-end gap-2">
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export function AgendaMonthSkeleton() {
  return (
    <div className="rounded-lg bg-white shadow">
      <div className="grid grid-cols-7 border-b border-gray-200">
        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
          <div
            key={day}
            className="border-r border-gray-200 p-3 text-center text-sm font-semibold text-gray-700 last:border-r-0"
          >
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {Array.from({ length: 42 }).map((_, i) => (
          <div
            key={i}
            className="min-h-[100px] border-r border-b border-gray-200 p-2 last:border-r-0"
          >
            <Skeleton className="mb-2 h-5 w-6" />
            <div className="space-y-1">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AgendaWeekSkeleton() {
  const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 6h à 22h

  return (
    <div className="overflow-auto rounded-lg bg-white shadow">
      <div className="grid grid-cols-8 border-b border-gray-200 bg-gray-50 text-xs font-medium text-gray-500">
        <div className="px-3 py-2 text-right">(UTC+01:00) Hr</div>
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="border-l border-gray-200 px-3 py-2 text-center">
            <Skeleton className="mx-auto h-4 w-12" />
            <Skeleton className="mx-auto mt-1 h-8 w-8 rounded-full" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-8 text-xs">
        <div className="border-r border-gray-200 bg-gray-50">
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="flex h-16 items-start justify-end border-b border-gray-200 pr-2"
            >
              <Skeleton className="h-3 w-10" />
            </div>
          ))}
        </div>
        {Array.from({ length: 7 }).map((_, dayIndex) => (
          <div key={dayIndex} className="border-l border-gray-200">
            {HOURS.map((hour) => (
              <div key={hour} className="relative h-16 border-b border-gray-100 px-1.5 py-0.5">
                {Math.random() > 0.7 && <Skeleton className="h-12 w-full rounded" />}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function AgendaDaySkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-gray-200 bg-white p-4 shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-32" />
                  <div className="mt-2 flex items-center gap-4">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function UsersTableSkeleton() {
  return (
    <div className="overflow-x-auto rounded-lg bg-white shadow">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase sm:px-6">
              Utilisateur
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase sm:px-6">
              Email
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase sm:px-6">
              Rôle
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase sm:px-6">
              Email vérifié
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase sm:px-6">
              Compte
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {Array.from({ length: 6 }).map((_, i) => (
            <tr key={i} className="hover:bg-gray-50">
              <td className="px-3 py-4 whitespace-nowrap sm:px-6">
                <div className="flex items-center">
                  <Skeleton className="h-8 w-8 rounded-full sm:h-10 sm:w-10" />
                  <div className="ml-2 space-y-1 sm:ml-4">
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
              </td>
              <td className="px-3 py-4 whitespace-nowrap sm:px-6">
                <Skeleton className="h-4 w-40" />
              </td>
              <td className="px-3 py-4 whitespace-nowrap sm:px-6">
                <Skeleton className="h-8 w-24 rounded-md" />
              </td>
              <td className="px-3 py-4 whitespace-nowrap sm:px-6">
                <Skeleton className="h-6 w-20 rounded-full" />
              </td>
              <td className="px-3 py-4 whitespace-nowrap sm:px-6">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-9 rounded-full" />
                  <Skeleton className="h-4 w-12" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function TemplatesPageSkeleton() {
  return (
    <div className="h-full">
      {/* Header Skeleton */}
      <div className="border-b border-gray-200 bg-white px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-40 rounded-lg" />
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8">
        {/* Filtres Skeleton */}
        <div className="mb-6 flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-24 rounded-lg" />
          ))}
        </div>

        {/* Grille de templates Skeleton */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <Skeleton className="h-5 w-5" />
                    <Skeleton className="h-6 w-32" />
                  </div>
                  <Skeleton className="mb-2 h-6 w-20 rounded-full" />
                  <Skeleton className="mb-1 h-4 w-full" />
                  <Skeleton className="mb-1 h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
              <div className="mt-4 flex items-center justify-end gap-2">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
