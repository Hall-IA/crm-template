'use client';

import { useSession } from '@/lib/auth-client';
import { useEffect, useState } from 'react';
import { useViewAs } from '@/contexts/view-as-context';

/**
 * Hook personnalisé pour récupérer le rôle de l'utilisateur
 * Si le rôle n'est pas dans la session, on le récupère depuis l'API
 * Supporte le mode "vue en tant que" pour les admins
 */
export function useUserRole() {
  const { data: session, isPending } = useSession();
  const { viewAsUser, isViewingAsOther } = useViewAs();
  const [role, setRole] = useState<string | null>(null);
  const [realUserRole, setRealUserRole] = useState<string | null>(null); // Rôle de l'utilisateur réellement connecté
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isPending) return;

    if (!session?.user) {
      setRole(null);
      setRealUserRole(null);
      setLoading(false);
      return;
    }

    // Récupérer le rôle de l'utilisateur réellement connecté depuis l'API
    const fetchUserRole = async () => {
      try {
        const response = await fetch('/api/users/me');
        if (response.ok) {
          const userData = await response.json();
          const userRole = userData.role || 'USER';

          // Toujours stocker le rôle réel de l'utilisateur connecté
          setRealUserRole(userRole);

          // Si on est en mode "vue en tant que", utiliser le rôle de l'utilisateur visualisé
          if (isViewingAsOther && viewAsUser?.role) {
            setRole(viewAsUser.role);
          } else {
            setRole(userRole);
          }
        } else {
          setRole('USER');
          setRealUserRole('USER');
        }
      } catch (error) {
        console.error('Erreur lors de la récupération du rôle:', error);
        setRole('USER');
        setRealUserRole('USER');
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [session, isPending, isViewingAsOther, viewAsUser]);

  return {
    role,
    isAdmin: role === 'ADMIN',
    isRealAdmin: realUserRole === 'ADMIN', // True seulement si l'utilisateur connecté est vraiment admin
    isManager: role === 'MANAGER',
    isCommercial: role === 'COMMERCIAL',
    isTelepro: role === 'TELEPRO',
    isLoading: loading || isPending,
    currentUserId: isViewingAsOther ? viewAsUser?.id : session?.user?.id,
  };
}
