"use client";

import { useSession } from "@/lib/auth-client";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";

interface User {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  emailVerified: boolean;
  active: boolean;
  createdAt: string;
}

export default function UsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'USER',
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users');

      if (!response.ok) {
        throw new Error('Erreur lors du chargement');
      }

      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  // Charger les utilisateurs
  useEffect(() => {
    fetchUsers();
  }, []);
  
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création');
      }

      setSuccessMessage(data.message || 'Utilisateur créé avec succès, email d\'invitation envoyé');
      setShowAddModal(false);
      setFormData({ name: '', email: '', role: 'USER' });
      fetchUsers();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleToggleActive = async (userId: string, currentActive: boolean, userName: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentActive }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la mise à jour du statut');
      }

      setSuccessMessage(
        !currentActive
          ? `Compte de ${userName} activé`
          : `Compte de ${userName} désactivé`
      );
      fetchUsers();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleChangeRole = async (userId: string, newRole: 'USER' | 'ADMIN') => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la modification');
      }

      setSuccessMessage('Rôle modifié avec succès');
      fetchUsers();
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <div className="h-full">
      {/* Header */}
      <PageHeader
        title="Gestion des utilisateurs"
        description="Gérez les comptes et les rôles des utilisateurs"
        action={
          <button
            onClick={() => setShowAddModal(true)}
            className="cursor-pointer w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 sm:w-auto"
          >
            + Ajouter un utilisateur
          </button>
        }
      />

      {/* Content */}
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Messages */}
        {error && <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>}

        {successMessage && (
          <div className="mb-4 rounded-lg bg-green-50 p-4 text-sm text-green-600">{successMessage}</div>
        )}

        {/* Table */}
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
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-3 py-4 text-center text-sm text-gray-500 sm:px-6">
                    Chargement...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-4 text-center text-sm text-gray-500 sm:px-6">
                    Aucun utilisateur
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-3 py-4 whitespace-nowrap sm:px-6">
                      <div className="flex items-center">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 sm:h-10 sm:w-10">
                          {user.name[0].toUpperCase()}
                        </div>
                        <div className="ml-2 sm:ml-4 min-w-0">
                          <div className="truncate text-sm font-medium text-gray-900 sm:text-base">{user.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-xs whitespace-nowrap text-gray-500 sm:px-6 sm:text-sm">
                      <span className="truncate block max-w-[150px] sm:max-w-none">{user.email}</span>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap sm:px-6">
                      <select
                        value={user.role}
                        onChange={(e) => handleChangeRole(user.id, e.target.value as any)}
                        disabled={user.id === session?.user?.id}
                        className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50 sm:px-3 sm:text-sm"
                      >
                        <option value="USER">Utilisateur</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap sm:px-6">
                      {user.emailVerified ? (
                        <span className="inline-flex rounded-full bg-green-100 px-2 text-xs leading-5 font-semibold text-green-800">
                          Vérifié
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-yellow-100 px-2 text-xs leading-5 font-semibold text-yellow-800">
                          Non vérifié
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap sm:px-6">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={user.id === session?.user?.id}
                          onClick={() => handleToggleActive(user.id, user.active, user.name)}
                          className={`cursor-pointer relative inline-flex h-5 w-9 items-center rounded-full transition ${
                            user.active ? 'bg-green-500' : 'bg-gray-300'
                          } disabled:cursor-not-allowed disabled:opacity-60`}
                          aria-label={user.active ? 'Désactiver le compte' : 'Activer le compte'}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition ${
                              user.active ? 'translate-x-4.5' : 'translate-x-0.5'
                            }`}
                          />
                        </button>
                        <span className="text-xs font-medium text-gray-700">
                          {user.active ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal d'ajout */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500/20 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl sm:p-8">
            <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">Ajouter un utilisateur</h2>

            <form onSubmit={handleAddUser} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nom complet</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Un email d'invitation sera envoyé à cet utilisateur
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Rôle</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="USER">Utilisateur</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({ name: '', email: '', role: 'USER' });
                    setError('');
                  }}
                  className="cursor-pointer flex-1 rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="cursor-pointer flex-1 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
                >
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

