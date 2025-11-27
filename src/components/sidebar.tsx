"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useUserRole } from "@/hooks/use-user-role";

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const router = useRouter();

  // Obtenir le rôle de l'utilisateur via le hook personnalisé
  const { isAdmin } = useUserRole();
  // Navigation conditionnelle basée sur le rôle
  const navigation = useMemo(() => {
    const baseNav = [
      { name: 'Tableau de bord', href: '/dashboard', icon: '📊' },
      { name: 'Contacts', href: '/contacts', icon: '👥' },
      { name: 'Paramètres', href: '/settings', icon: '⚙️' },
    ];

    // Ajouter la gestion des utilisateurs seulement pour les admins
    if (isAdmin) {
      baseNav.splice(2, 0, {
        name: "Gestions d'utilisateurs",
        href: "/users",
        icon: "👤",
      });
    }

    return baseNav;
  }, [isAdmin]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/signin");
  };

  return (
    <div className="flex h-screen w-64 flex-col border-r border-gray-200 bg-white">
      {/* Logo/Brand */}
      <div className="flex h-16 items-center border-b border-gray-200 px-6">
        <h1 className="text-xl font-bold text-indigo-600">CRM Template</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-indigo-50 text-indigo-600"
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
            {session?.user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-gray-900">
              {session?.user?.name || "Utilisateur"}
            </p>
            <p className="truncate text-xs text-gray-500">
              {session?.user?.email}
            </p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="mt-3 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
        >
          Déconnexion
        </button>
      </div>
    </div>
  );
}

