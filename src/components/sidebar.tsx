'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useEffect } from 'react';
import { useUserRole } from '@/hooks/use-user-role';
import { useMobileMenuContext } from '@/contexts/mobile-menu-context';
import { useSidebarContext } from '@/contexts/sidebar-context';
import { useViewAs } from '@/contexts/view-as-context';
import { ViewAsModal } from '@/components/view-as-modal';
import {
  LayoutDashboard,
  Users,
  UserCog,
  Settings,
  Calendar as CalendarIcon,
  Pin,
  PinOff,
  FileText,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const router = useRouter();
  const { isOpen: isMobileMenuOpen, setIsOpen: setIsMobileMenuOpen } = useMobileMenuContext();
  const { isCollapsed, isPinned, setIsCollapsed, togglePin } = useSidebarContext();
  const { viewAsUser, isViewingAsOther } = useViewAs();
  const [showViewAsModal, setShowViewAsModal] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Éviter l'erreur d'hydratation
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Obtenir le rôle de l'utilisateur via le hook personnalisé
  const { isAdmin, isRealAdmin } = useUserRole();
  // Navigation conditionnelle basée sur le rôle
  const navigation = useMemo(() => {
    const baseNav = [
      { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Agenda', href: '/agenda', icon: CalendarIcon },
      { name: 'Contacts', href: '/contacts', icon: Users },
      { name: 'Templates', href: '/templates', icon: FileText },
      { name: 'Paramètres', href: '/settings', icon: Settings },
    ];

    // Ajouter la gestion des droits d'accès seulement pour les admins
    if (isAdmin) {
      baseNav.splice(baseNav.length - 1, 0, {
        name: "Droits d'accès",
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
          className="fixed inset-0 z-40 bg-gray-500/20 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed top-0 left-0 z-40 flex h-screen flex-col border-r border-gray-200 bg-white transition-all duration-300 ease-in-out lg:relative lg:translate-x-0',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          // En mobile, toujours w-64. En desktop, utiliser le système de collapse
          isCollapsed && !isPinned ? 'w-64 lg:w-16' : 'w-64 lg:w-64',
        )}
        onMouseEnter={() => {
          // Le système de hover ne s'applique qu'en desktop (lg:)
          // Vérifier la largeur de l'écran pour éviter les problèmes en mobile
          if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
            if (!isPinned && isCollapsed) {
              setIsCollapsed(false);
            }
          }
        }}
        onMouseLeave={() => {
          // Le système de hover ne s'applique qu'en desktop (lg:)
          // Vérifier la largeur de l'écran pour éviter les problèmes en mobile
          if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
            if (!isPinned && !isCollapsed) {
              setIsCollapsed(true);
            }
          }
        }}
      >
        {/* Logo/Brand */}
        <div
          className={cn(
            'flex h-16 items-center justify-between border-b border-gray-200 transition-all duration-300',
            isCollapsed && !isPinned ? 'px-6 lg:justify-center lg:px-2' : 'px-6',
          )}
        >
          {!isCollapsed || isPinned ? (
            <>
              <h1 className="text-xl font-bold whitespace-nowrap text-indigo-600">CRM Template</h1>
              <div className="flex items-center gap-2">
                {/* Bouton Pin/Unpin - Desktop seulement */}
                <button
                  onClick={togglePin}
                  className="hidden cursor-pointer rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 lg:block"
                  aria-label={isPinned ? 'Désépingler la sidebar' : 'Épingler la sidebar'}
                  title={isPinned ? 'Désépingler' : 'Épingler'}
                >
                  {isPinned ? <Pin className="h-5 w-5" /> : <PinOff className="h-5 w-5" />}
                </button>
                {/* Bouton fermer - Mobile seulement */}
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
            </>
          ) : (
            <div className="flex w-full items-center justify-center">
              {/* Bouton Pin/Unpin - Visible même quand réduit */}
              <button
                onClick={togglePin}
                className="hidden cursor-pointer rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 lg:block"
                aria-label={isPinned ? 'Désépingler la sidebar' : 'Épingler la sidebar'}
                title={isPinned ? 'Désépingler' : 'Épingler'}
              >
                {isPinned ? <Pin className="h-5 w-5" /> : <PinOff className="h-5 w-5" />}
              </button>
              {/* Bouton fermer - Mobile seulement */}
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
          )}
        </div>

        {/* Navigation */}
        <nav
          className={cn(
            'flex-1 space-y-1 overflow-y-auto py-4 transition-all duration-300',
            isCollapsed && !isPinned ? 'px-3 lg:px-2' : 'px-3',
          )}
        >
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={handleLinkClick}
                className={cn(
                  'flex items-center gap-3 rounded-lg py-2 text-sm font-medium transition-colors',
                  isCollapsed && !isPinned ? 'px-3 lg:justify-center lg:px-2' : 'px-3',
                  isActive
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900',
                )}
                title={isCollapsed && !isPinned ? item.name : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {(!isCollapsed || isPinned) && (
                  <span className="whitespace-nowrap">{item.name}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Vue active - pour les admins seulement */}
        {isRealAdmin && (
          <div
            className={cn(
              'border-t border-gray-200 transition-all duration-300',
              isCollapsed && !isPinned ? 'p-3 lg:p-2' : 'p-3',
            )}
          >
            {!isCollapsed || isPinned ? (
              <button
                onClick={() => setShowViewAsModal(true)}
                className={cn(
                  'w-full cursor-pointer rounded-lg border-2 p-3 text-left transition-all',
                  isViewingAsOther
                    ? 'border-indigo-600 bg-indigo-600 text-white hover:border-indigo-700 hover:bg-indigo-700'
                    : 'border-gray-300 bg-white text-gray-900 hover:border-indigo-300 hover:bg-indigo-50',
                )}
                aria-label="Changer de vue"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                      isViewingAsOther ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-600',
                    )}
                  >
                    {!isMounted
                      ? 'U'
                      : isViewingAsOther
                        ? viewAsUser?.name?.[0]?.toUpperCase() || 'U'
                        : session?.user?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        'text-xs font-medium',
                        isViewingAsOther ? 'text-white/80' : 'text-gray-500',
                      )}
                    >
                      {isViewingAsOther ? 'Vue:' : 'Ma vue'}
                    </p>
                    <p className={`truncate text-sm font-semibold`}>
                      {!isMounted
                        ? 'Utilisateur'
                        : isViewingAsOther
                          ? viewAsUser?.name
                          : session?.user?.name || 'Utilisateur'}
                    </p>
                  </div>
                  <Eye className="h-5 w-5 shrink-0" />
                </div>
              </button>
            ) : (
              <button
                onClick={() => setShowViewAsModal(true)}
                className={cn(
                  'w-full cursor-pointer rounded-lg p-2 transition-colors',
                  isViewingAsOther
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'text-gray-500 hover:bg-gray-100',
                )}
                title="Changer de vue"
                aria-label="Changer de vue"
              >
                <div className="flex items-center justify-center">
                  <Eye className="h-5 w-5" />
                </div>
              </button>
            )}
          </div>
        )}

        {/* User Profile */}
        <div
          className={cn(
            'border-t border-gray-200 transition-all duration-300',
            isCollapsed && !isPinned ? 'p-4 lg:p-2' : 'p-4',
          )}
        >
          {!isCollapsed || isPinned ? (
            <>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                  {!isMounted ? 'U' : session?.user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {!isMounted ? 'Utilisateur' : session?.user?.name || 'Utilisateur'}
                  </p>
                  <p className="truncate text-xs text-gray-500">
                    {!isMounted ? '' : session?.user?.email}
                  </p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="mt-3 w-full cursor-pointer rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
              >
                Déconnexion
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                {!isMounted ? 'U' : session?.user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <button
                onClick={handleSignOut}
                className="cursor-pointer rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100"
                title="Déconnexion"
                aria-label="Déconnexion"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de changement de vue */}
      <ViewAsModal isOpen={showViewAsModal} onClose={() => setShowViewAsModal(false)} />
    </>
  );
}
