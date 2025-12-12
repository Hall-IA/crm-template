'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Key, Search } from 'lucide-react';
import { PERMISSIONS_BY_CATEGORY, PERMISSION_CATEGORIES } from '@/lib/permissions';

export default function PermissionsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Filtrer les permissions par catégorie et terme de recherche
  const filteredCategories = Object.entries(PERMISSIONS_BY_CATEGORY).filter(
    ([category]) => selectedCategory === 'all' || category === selectedCategory,
  );

  const filteredPermissions = filteredCategories.map(([category, permissions]) => {
    const filtered = permissions.filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    return [category, filtered] as const;
  });

  const totalPermissions = PERMISSIONS_BY_CATEGORY
    ? Object.values(PERMISSIONS_BY_CATEGORY).reduce((sum, perms) => sum + perms.length, 0)
    : 0;

  const categoryColors: Record<string, { bg: string; text: string }> = {
    [PERMISSION_CATEGORIES.ANALYTICS]: {
      bg: 'bg-yellow-50',
      text: 'text-yellow-700',
    },
    [PERMISSION_CATEGORIES.CONTACTS]: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
    },
    [PERMISSION_CATEGORIES.TASKS]: {
      bg: 'bg-green-50',
      text: 'text-green-700',
    },
    [PERMISSION_CATEGORIES.TEMPLATES]: {
      bg: 'bg-purple-50',
      text: 'text-purple-700',
    },
    [PERMISSION_CATEGORIES.INTEGRATIONS]: {
      bg: 'bg-pink-50',
      text: 'text-pink-700',
    },
    [PERMISSION_CATEGORIES.USERS]: {
      bg: 'bg-orange-50',
      text: 'text-orange-700',
    },
    [PERMISSION_CATEGORIES.SETTINGS]: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-700',
    },
    [PERMISSION_CATEGORIES.GENERAL]: {
      bg: 'bg-gray-50',
      text: 'text-gray-700',
    },
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
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion des permissions</h1>
            <p className="mt-1 text-sm text-gray-500">
              {totalPermissions} permissions disponibles dans le système
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {/* Barre de recherche et filtres */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une permission..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="all">Toutes les catégories</option>
            {Object.values(PERMISSION_CATEGORIES).map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Liste des permissions par catégorie */}
        <div className="space-y-8">
          {filteredPermissions.map(([category, permissions]) => {
            if (permissions.length === 0) return null;

            const colors = categoryColors[category] || {
              bg: 'bg-gray-50',
              text: 'text-gray-700',
            };

            return (
              <div key={category}>
                <div className="mb-4 flex items-center gap-3">
                  <div className={`rounded-lg p-2 ${colors.bg}`}>
                    <Key className={`h-5 w-5 ${colors.text}`} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{category}</h2>
                    <p className="text-sm text-gray-500">
                      {permissions.length} permission
                      {permissions.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {permissions.map((permission) => (
                    <div
                      key={permission.code}
                      className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 rounded-lg p-2 ${colors.bg}`}>
                          <Key className={`h-4 w-4 ${colors.text}`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{permission.name}</h3>
                          <p className="mt-1 text-sm text-gray-600">{permission.description}</p>
                          <code className="mt-2 inline-block rounded bg-gray-100 px-2 py-1 font-mono text-xs text-gray-600">
                            {permission.code}
                          </code>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {filteredPermissions.every(([, perms]) => perms.length === 0) && (
          <div className="py-12 text-center">
            <Key className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-sm font-medium text-gray-900">Aucune permission trouvée</h3>
            <p className="mt-1 text-sm text-gray-500">
              Essayez de modifier vos critères de recherche
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
