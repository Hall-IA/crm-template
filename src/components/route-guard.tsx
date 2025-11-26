"use client";

import { useSession } from "@/lib/auth-client";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

interface RouteGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

/**
 * Composant de protection des routes (proxy)
 * Protège les routes nécessitant une authentification
 */
export function RouteGuard({
  children,
  requireAuth = true,
  redirectTo = "/signin",
}: RouteGuardProps) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isPending) return;

    // Si l'authentification est requise et l'utilisateur n'est pas connecté
    if (requireAuth && !session) {
      router.push(redirectTo);
      return;
    }

    // Si l'utilisateur est connecté et sur une page d'auth, rediriger vers le dashboard
    const authPages = ["/signin", "/signup"];
    if (session && authPages.includes(pathname)) {
      router.push("/dashboard");
    }
  }, [session, isPending, requireAuth, redirectTo, router, pathname]);

  // Afficher un loader pendant la vérification
  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600"></div>
          <p className="text-sm text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // Si l'authentification est requise et l'utilisateur n'est pas connecté, ne rien afficher
  if (requireAuth && !session) {
    return null;
  }

  return <>{children}</>;
}

