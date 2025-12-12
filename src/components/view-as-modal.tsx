'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/lib/auth-client';
import { useViewAs } from '@/contexts/view-as-context';
import { X, Check, User as UserIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface User {
  id: string;
  name: string;
  email: string;
  customRole: {
    id: string;
    name: string;
    permissions: string[];
  } | null;
}

interface ViewAsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ViewAsModal({ isOpen, onClose }: ViewAsModalProps) {
  const { data: session } = useSession();
  const { viewAsUser, setViewAsUser, clearViewAsUser } = useViewAs();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users/list');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (user: User) => {
    setViewAsUser(user);
    onClose();
    // Rafraîchir la page pour appliquer les changements
    router.refresh();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center rounded-lg bg-gray-500/20 p-4 shadow-xl backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl">
        {/* En-tête */}
        <div className="flex items-center justify-between rounded-t-lg border-b border-gray-200 bg-indigo-600 px-6 py-4">
          <div className="flex items-center gap-3 text-white">
            <UserIcon className="h-6 w-6" />
            <div>
              <h2 className="text-xl font-bold">Changer de vue</h2>
              <p className="text-sm text-white/90">
                Voir l'application avec les permissions d'un profil
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-lg p-2 text-white transition-colors hover:bg-white/20"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contenu */}
        <div className="max-h-[60vh] overflow-y-auto p-6">
          {loading ? (
            <div className="py-12 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Ma vue */}
              {session?.user && (
                <button
                  onClick={() => {
                    clearViewAsUser();
                    onClose();
                    router.refresh();
                  }}
                  className={cn(
                    'w-full cursor-pointer rounded-lg border-2 p-4 text-left transition-all',
                    !viewAsUser
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          'flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold',
                          !viewAsUser
                            ? 'bg-indigo-600 text-white'
                            : 'bg-indigo-100 text-indigo-600',
                        )}
                      >
                        {getInitials(session.user.name || session.user.email)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">Ma vue</span>
                          {!viewAsUser && <span className="text-sm text-indigo-600">← Retour</span>}
                        </div>
                        <span className="text-sm text-gray-600">{session.user.name}</span>
                      </div>
                    </div>
                    {!viewAsUser && <Check className="h-6 w-6 text-indigo-600" />}
                  </div>
                </button>
              )}

              {/* Autres utilisateurs */}
              {users
                .filter((user) => user.id !== session?.user?.id)
                .map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    className={cn(
                      'w-full cursor-pointer rounded-lg border-2 p-4 text-left transition-all',
                      viewAsUser?.id === user.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50',
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className={cn(
                            'flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold',
                            viewAsUser?.id === user.id
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-200 text-gray-600',
                          )}
                        >
                          {getInitials(user.name || user.email)}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-600">
                            {user.customRole?.name || 'Sans profil'} · {user.email.split('@')[0]}
                          </div>
                        </div>
                      </div>
                      {viewAsUser?.id === user.id && <Check className="h-6 w-6 text-indigo-600" />}
                    </div>
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
