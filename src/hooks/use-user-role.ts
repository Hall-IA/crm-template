'use client';

import { useSession } from '@/lib/auth-client';
import { useEffect, useState } from 'react';
import { useViewAs } from '@/contexts/view-as-context';

/**
 * Hook personnalisé pour récupérer les permissions de l'utilisateur via son profil
 * Les droits sont déterminés par le profil assigné, pas par un rôle
 * Supporte le mode "vue en tant que" pour les admins
 */
export function useUserRole() {
  const { data: session, isPending } = useSession();
  const { viewAsUser, isViewingAsOther } = useViewAs();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [realUserPermissions, setRealUserPermissions] = useState<string[]>([]); // Permissions de l'utilisateur réellement connecté
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isPending) return;

    if (!session?.user) {
      setPermissions([]);
      setRealUserPermissions([]);
      setLoading(false);
      return;
    }

    // Récupérer les permissions de l'utilisateur depuis l'API
    const fetchUserPermissions = async () => {
      try {
        const response = await fetch('/api/users/me');
        if (response.ok) {
          const userData = await response.json();
          const userPerms = (userData.customRole?.permissions as string[]) || [];

          // Toujours stocker les permissions réelles de l'utilisateur connecté
          setRealUserPermissions(userPerms);

          // Si on est en mode "vue en tant que", utiliser les permissions de l'utilisateur visualisé
          if (isViewingAsOther && viewAsUser?.permissions) {
            setPermissions(viewAsUser.permissions);
          } else {
            setPermissions(userPerms);
          }
        } else {
          setPermissions([]);
          setRealUserPermissions([]);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des permissions:', error);
        setPermissions([]);
        setRealUserPermissions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUserPermissions();
  }, [session, isPending, isViewingAsOther, viewAsUser]);

  // Helper pour vérifier une permission
  const hasPermission = (permission: string) => permissions.includes(permission);
  const hasRealPermission = (permission: string) => realUserPermissions.includes(permission);

  return {
    permissions,
    realUserPermissions,
    hasPermission,
    hasRealPermission,
    // Helpers de compatibilité basés sur les permissions
    isAdmin: hasPermission('users.manage_roles'), // Admin = peut gérer les rôles
    isRealAdmin: hasRealPermission('users.manage_roles'), // True seulement si l'utilisateur connecté peut gérer les rôles
    isManager: hasPermission('users.view'), // Manager = peut voir les utilisateurs
    isCommercial: hasPermission('contacts.view_own'), // Commercial = peut voir ses contacts
    isTelepro: hasPermission('contacts.view_own'), // Télépro = peut voir ses contacts
    isLoading: loading || isPending,
    currentUserId: isViewingAsOther ? viewAsUser?.id : session?.user?.id,
    // Rôle par défaut pour compatibilité
    role: 'USER',
  };
}
