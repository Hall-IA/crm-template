'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { useUserRole } from '@/hooks/use-user-role';
import { useMobileMenuContext } from '@/contexts/mobile-menu-context';
import { LayoutDashboard, Users, UserCog, Settings, Calendar as CalendarIcon } from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const router = useRouter();
  const { isOpen: isMobileMenuOpen, setIsOpen: setIsMobileMenuOpen } = useMobileMenuContext();

  // Obtenir le rôle de l'utilisateur via le hook personnalisé
  const { isAdmin } = useUserRole();
  // Navigation conditionnelle basée sur le rôle
  const navigation = useMemo(() => {
    const baseNav = [
      { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Agenda', href: '/agenda', icon: CalendarIcon },
      { name: 'Contacts', href: '/contacts', icon: Users },
      { name: 'Paramètres', href: '/settings', icon: Settings },
    ];

    // Ajouter la gestion des utilisateurs seulement pour les admins
    if (isAdmin) {
      baseNav.splice(baseNav.length - 1, 0, {
        name: "Gestions d'utilisateurs",
        href: '/users',
        icon: UserCog,
      });
    }

    return baseNav;
  }, [isAdmin]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/signin');
  };

  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="bg-opacity-50 fixed inset-0 z-40 bg-black lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 z-40 flex h-screen w-64 flex-col border-r border-gray-200 bg-white transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo/Brand */}
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-6">
          <h1 className="text-xl font-bold text-indigo-600">CRM Template</h1>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="cursor-pointer lg:hidden"
            aria-label="Close menu"
          >
            <svg
              className="h-6 w-6 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={handleLinkClick}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
              {session?.user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">
                {session?.user?.name || 'Utilisateur'}
              </p>
              <p className="truncate text-xs text-gray-500">{session?.user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="mt-3 w-full cursor-pointer rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
          >
            Déconnexion
          </button>
        </div>
      </div>
    </>
  );
}
