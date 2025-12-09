'use client';

import { useSession } from '@/lib/auth-client';
import { useEffect, useState } from 'react';

/**
 * Hook personnalisé pour récupérer le rôle de l'utilisateur
 * Si le rôle n'est pas dans la session, on le récupère depuis l'API
 */
export function useUserRole() {
  const { data: session, isPending } = useSession();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isPending) return;

    if (!session?.user) {
      setRole(null);
      setLoading(false);
      return;
    }

    // Essayer d'obtenir le rôle depuis la session
    const sessionRole = (session.user as any).role;

    if (sessionRole) {
      setRole(sessionRole);
      setLoading(false);
      return;
    }

    // Si le rôle n'est pas dans la session, le récupérer depuis l'API
    const fetchUserRole = async () => {
      try {
        const response = await fetch('/api/users/me');
        if (response.ok) {
          const userData = await response.json();
          setRole(userData.role || 'USER');
        } else {
          // Valeur par défaut si erreur
          setRole('USER');
        }
      } catch (error) {
        console.error('Erreur lors de la récupération du rôle:', error);
        setRole('USER'); // Valeur par défaut
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [session, isPending]);

  return {
    role,
    isAdmin: role === 'ADMIN',
    isLoading: loading || isPending,
  };
}
