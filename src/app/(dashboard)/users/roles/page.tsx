'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, Users as UsersIcon, Key, Plus, Edit, Trash2, X } from 'lucide-react';
import { PERMISSIONS, PERMISSIONS_BY_CATEGORY } from '@/lib/permissions';

interface Role {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  isSystem: boolean;
  usersCount: number;
  createdAt: string | null;
  updatedAt: string | null;
}

interface RoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  role?: Role;
}

function RoleModal({ isOpen, onClose, onSave, role }: RoleModalProps) {
  const [formData, setFormData] = useState({
    name: role?.name || '',
    description: role?.description || '',
    permissions: role?.permissions || [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Réinitialiser le formulaire quand le rôle change
  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name,
        description: role.description || '',
        permissions: role.permissions,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        permissions: [],
      });
    }
    setError('');
  }, [role, isOpen]);

  const togglePermission = (permissionCode: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permissionCode)
        ? prev.permissions.filter((p) => p !== permissionCode)
        : [...prev.permissions, permissionCode],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const url = role ? `/api/roles/${role.id}` : '/api/roles';
      const method = role ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'enregistrement');
      }

      onSave();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-gray-500/20 p-4 backdrop-blur-sm">
      <div className="my-8 w-full max-w-2xl rounded-lg bg-white shadow-xl">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {role ? 'Modifier le profil' : 'Nouveau profil'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="cursor-pointer rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="max-h-[70vh] overflow-y-auto p-6">
            {error && (
              <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-600">
                {error}
              </div>
            )}
            <div className="space-y-6">
              {/* Nom et description */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Nom du profil *
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    rows={2}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Permissions */}
              <div>
                <h3 className="mb-4 text-base font-semibold text-gray-900">Permissions</h3>

                <div className="space-y-6">
                  {Object.entries(PERMISSIONS_BY_CATEGORY).map(([category, permissions]) => (
                    <div key={category}>
                      <h4 className="mb-3 text-sm font-medium tracking-wide text-gray-500 uppercase">
                        {category}
                      </h4>
                      <div className="space-y-2">
                        {permissions.map((permission) => (
                          <label
                            key={permission.code}
                            className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50"
                          >
                            <input
                              type="checkbox"
                              checked={formData.permissions.includes(permission.code)}
                              onChange={() => togglePermission(permission.code)}
                              className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{permission.name}</div>
                              <div className="text-sm text-gray-500">{permission.description}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-200 p-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="cursor-pointer rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function RolesPage() {
  const [showModal, setShowModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/roles');
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des profils');
      }
      const data = await response.json();
      setRoles(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleEditRole = (roleId: string) => {
    const role = roles.find((r) => r.id === roleId);
    if (role) {
      setSelectedRole(role);
      setShowModal(true);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    const role = roles.find((r) => r.id === roleId);
    if (!role) return;

    const confirmMessage = role.isSystem
      ? `⚠️ Attention : "${role.name}" est un profil système.\n\nÊtes-vous sûr de vouloir le supprimer ?`
      : `Êtes-vous sûr de vouloir supprimer le profil "${role.name}" ?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const response = await fetch(`/api/roles/${roleId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la suppression');
      }

      await fetchRoles();
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedRole(null);
  };

  const handleSaveRole = async () => {
    await fetchRoles();
  };

  return (
    <div className="h-full">
      <div className="border-b border-gray-200 bg-white">
        <div className="p-4 sm:p-6">
          <Link
            href="/users"
            className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestion des profils</h1>
              <p className="mt-1 text-sm text-gray-500">
                Créer et configurer les profils avec leurs permissions
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedRole(null);
                setShowModal(true);
              }}
              className="flex cursor-pointer items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              <Plus className="h-4 w-4" />
              Nouveau profil
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid gap-6 lg:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 animate-pulse rounded-lg bg-gray-200" />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {roles
              .sort((a, b) => b.permissions.length - a.permissions.length) // Trier par nombre de permissions (DESC)
              .map((role) => {
                const visiblePermissions = role.permissions.slice(0, 4);
                const remainingCount = role.permissions.length - 4;

                return (
                  <div
                    key={role.id}
                    className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-green-100 p-2">
                          <Shield className="h-5 w-5 text-green-600" />
                        </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {role.name}
                          {role.isSystem && (
                            <span className="ml-2 inline-block rounded bg-indigo-100 px-2 py-0.5 text-xs text-indigo-600">
                              Système
                            </span>
                          )}
                        </h3>
                        <p className="mt-1 text-sm text-gray-600">{role.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditRole(role.id)}
                        className="cursor-pointer rounded-lg p-2 text-orange-600 hover:bg-orange-50"
                        title="Modifier"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteRole(role.id)}
                        className="cursor-pointer rounded-lg p-2 text-red-600 hover:bg-red-50"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <UsersIcon className="h-4 w-4" />
                    <span>
                      {role.usersCount} utilisateur{role.usersCount > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Key className="h-4 w-4" />
                    <span>
                      {role.permissions.length} permission{role.permissions.length > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <h4 className="mb-2 text-xs font-medium tracking-wide text-gray-500 uppercase">
                    Permissions
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {visiblePermissions.map((permCode) => {
                      const perm = PERMISSIONS.find((p) => p.code === permCode);
                      return (
                        <span
                          key={permCode}
                          className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700"
                        >
                          {perm?.name || permCode}
                        </span>
                      );
                    })}
                    {remainingCount > 0 && (
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                        +{remainingCount} autres
                      </span>
                    )}
                    </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      <RoleModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onSave={handleSaveRole}
        role={selectedRole || undefined}
      />
    </div>
  );
}
