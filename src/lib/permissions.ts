/**
 * Système de permissions du CRM
 * Chaque permission est définie par un code unique et une description
 */

export interface Permission {
  code: string;
  name: string;
  description: string;
  category: string;
}

export const PERMISSION_CATEGORIES = {
  ANALYTICS: 'Analytics',
  CONTACTS: 'Contacts',
  TASKS: 'Tâches',
  TEMPLATES: 'Templates',
  INTEGRATIONS: 'Intégrations',
  USERS: 'Utilisateurs',
  SETTINGS: 'Paramètres',
  GENERAL: 'Général',
} as const;

export const PERMISSIONS: Permission[] = [
  // Analytics
  {
    code: 'analytics.view',
    name: 'Voir les analytics',
    description: 'Permet de voir les statistiques et analytics',
    category: PERMISSION_CATEGORIES.ANALYTICS,
  },
  {
    code: 'analytics.export',
    name: 'Exporter les analytics',
    description: "Autorise l'exportation des données analytics",
    category: PERMISSION_CATEGORIES.ANALYTICS,
  },

  // Contacts
  {
    code: 'contacts.view_all',
    name: 'Voir tous les contacts',
    description:
      'Permet de voir tous les contacts de toutes les entreprises (réservé aux administrateurs)',
    category: PERMISSION_CATEGORIES.CONTACTS,
  },
  {
    code: 'contacts.view_own',
    name: 'Voir ses contacts',
    description: 'Permet de voir uniquement les contacts qui lui sont assignés',
    category: PERMISSION_CATEGORIES.CONTACTS,
  },
  {
    code: 'contacts.view_unassigned',
    name: 'Voir les contacts non attribués',
    description: "Permet de voir les contacts qui n'ont pas encore été assignés",
    category: PERMISSION_CATEGORIES.CONTACTS,
  },
  {
    code: 'contacts.create',
    name: 'Créer un contact',
    description: 'Autorise la création de nouveaux contacts',
    category: PERMISSION_CATEGORIES.CONTACTS,
  },
  {
    code: 'contacts.edit_own',
    name: 'Modifier ses contacts',
    description: 'Autorise la modification des contacts qui lui sont assignés',
    category: PERMISSION_CATEGORIES.CONTACTS,
  },
  {
    code: 'contacts.edit_all',
    name: 'Modifier tous les contacts',
    description: 'Autorise la modification de tous les contacts',
    category: PERMISSION_CATEGORIES.CONTACTS,
  },
  {
    code: 'contacts.delete',
    name: 'Supprimer un contact',
    description: 'Autorise la suppression de contacts',
    category: PERMISSION_CATEGORIES.CONTACTS,
  },
  {
    code: 'contacts.assign',
    name: 'Assigner des contacts',
    description: "Permet d'assigner des contacts à d'autres utilisateurs",
    category: PERMISSION_CATEGORIES.CONTACTS,
  },
  {
    code: 'contacts.import',
    name: 'Importer des contacts',
    description: "Autorise l'importation de contacts via CSV/Excel",
    category: PERMISSION_CATEGORIES.CONTACTS,
  },
  {
    code: 'contacts.export',
    name: 'Exporter des contacts',
    description: "Autorise l'exportation de contacts",
    category: PERMISSION_CATEGORIES.CONTACTS,
  },
  {
    code: 'contacts.upload_files',
    name: 'Upload de fichiers',
    description: 'Permet de télécharger des fichiers pour les contacts',
    category: PERMISSION_CATEGORIES.CONTACTS,
  },
  {
    code: 'contacts.view_files',
    name: 'Voir les fichiers',
    description: 'Permet de voir les fichiers associés aux contacts',
    category: PERMISSION_CATEGORIES.CONTACTS,
  },

  // Tâches
  {
    code: 'tasks.view_all',
    name: 'Voir toutes les tâches',
    description: 'Permet de voir toutes les tâches de tous les utilisateurs',
    category: PERMISSION_CATEGORIES.TASKS,
  },
  {
    code: 'tasks.view_own',
    name: 'Voir ses tâches',
    description: 'Permet de voir uniquement ses propres tâches',
    category: PERMISSION_CATEGORIES.TASKS,
  },
  {
    code: 'tasks.create',
    name: 'Créer une tâche',
    description: 'Autorise la création de nouvelles tâches',
    category: PERMISSION_CATEGORIES.TASKS,
  },
  {
    code: 'tasks.edit_own',
    name: 'Modifier ses tâches',
    description: 'Autorise la modification de ses propres tâches',
    category: PERMISSION_CATEGORIES.TASKS,
  },
  {
    code: 'tasks.edit_all',
    name: 'Modifier toutes les tâches',
    description: 'Autorise la modification de toutes les tâches',
    category: PERMISSION_CATEGORIES.TASKS,
  },
  {
    code: 'tasks.delete',
    name: 'Supprimer une tâche',
    description: 'Autorise la suppression de tâches',
    category: PERMISSION_CATEGORIES.TASKS,
  },
  {
    code: 'tasks.assign',
    name: 'Assigner des tâches',
    description: "Permet d'assigner des tâches à d'autres utilisateurs",
    category: PERMISSION_CATEGORIES.TASKS,
  },

  // Templates
  {
    code: 'templates.view',
    name: 'Voir les templates',
    description: 'Permet de voir les templates disponibles',
    category: PERMISSION_CATEGORIES.TEMPLATES,
  },
  {
    code: 'templates.create',
    name: 'Créer un template',
    description: 'Autorise la création de nouveaux templates',
    category: PERMISSION_CATEGORIES.TEMPLATES,
  },
  {
    code: 'templates.edit',
    name: 'Modifier un template',
    description: 'Autorise la modification de templates',
    category: PERMISSION_CATEGORIES.TEMPLATES,
  },
  {
    code: 'templates.delete',
    name: 'Supprimer un template',
    description: 'Autorise la suppression de templates',
    category: PERMISSION_CATEGORIES.TEMPLATES,
  },

  // Intégrations
  {
    code: 'integrations.view',
    name: 'Voir les intégrations',
    description: 'Permet de voir les intégrations configurées',
    category: PERMISSION_CATEGORIES.INTEGRATIONS,
  },
  {
    code: 'integrations.create',
    name: 'Créer une intégration',
    description: 'Autorise la création de nouvelles intégrations',
    category: PERMISSION_CATEGORIES.INTEGRATIONS,
  },
  {
    code: 'integrations.edit',
    name: 'Modifier une intégration',
    description: "Autorise la modification d'intégrations",
    category: PERMISSION_CATEGORIES.INTEGRATIONS,
  },
  {
    code: 'integrations.delete',
    name: 'Supprimer une intégration',
    description: "Autorise la suppression d'intégrations",
    category: PERMISSION_CATEGORIES.INTEGRATIONS,
  },
  {
    code: 'integrations.google.connect',
    name: 'Connecter Google',
    description: 'Permet de connecter son compte Google',
    category: PERMISSION_CATEGORIES.INTEGRATIONS,
  },
  {
    code: 'integrations.meta.manage',
    name: 'Gérer les leads Meta',
    description: 'Permet de configurer les intégrations Meta (Facebook)',
    category: PERMISSION_CATEGORIES.INTEGRATIONS,
  },
  {
    code: 'integrations.google_ads.manage',
    name: 'Gérer les leads Google Ads',
    description: 'Permet de configurer les intégrations Google Ads',
    category: PERMISSION_CATEGORIES.INTEGRATIONS,
  },
  {
    code: 'integrations.google_sheets.manage',
    name: 'Gérer les Google Sheets',
    description: 'Permet de configurer les synchronisations Google Sheets',
    category: PERMISSION_CATEGORIES.INTEGRATIONS,
  },

  // Utilisateurs
  {
    code: 'users.view',
    name: 'Voir les utilisateurs',
    description: 'Permet de voir la liste des utilisateurs',
    category: PERMISSION_CATEGORIES.USERS,
  },
  {
    code: 'users.create',
    name: 'Créer un utilisateur',
    description: 'Autorise la création de nouveaux utilisateurs',
    category: PERMISSION_CATEGORIES.USERS,
  },
  {
    code: 'users.edit',
    name: 'Modifier un utilisateur',
    description: "Autorise la modification d'utilisateurs",
    category: PERMISSION_CATEGORIES.USERS,
  },
  {
    code: 'users.deactivate',
    name: 'Désactiver un utilisateur',
    description: "Autorise la désactivation d'utilisateurs",
    category: PERMISSION_CATEGORIES.USERS,
  },
  {
    code: 'users.delete',
    name: 'Supprimer un utilisateur',
    description: "Autorise la suppression définitive d'utilisateurs",
    category: PERMISSION_CATEGORIES.USERS,
  },
  {
    code: 'users.manage_roles',
    name: 'Gérer les rôles',
    description: 'Permet de gérer les profils et permissions',
    category: PERMISSION_CATEGORIES.USERS,
  },

  // Paramètres
  {
    code: 'settings.view',
    name: 'Voir les paramètres',
    description: 'Permet de voir les paramètres du système',
    category: PERMISSION_CATEGORIES.SETTINGS,
  },
  {
    code: 'settings.company.edit',
    name: "Modifier les infos de l'entreprise",
    description: "Autorise la modification des informations de l'entreprise",
    category: PERMISSION_CATEGORIES.SETTINGS,
  },
  {
    code: 'settings.smtp.edit',
    name: 'Configurer SMTP',
    description: 'Permet de configurer les paramètres SMTP',
    category: PERMISSION_CATEGORIES.SETTINGS,
  },
  {
    code: 'settings.status.manage',
    name: 'Gérer les statuts',
    description: 'Permet de créer, modifier et supprimer des statuts',
    category: PERMISSION_CATEGORIES.SETTINGS,
  },

  // Général
  {
    code: 'general.view_all_companies',
    name: 'Voir les contacts de toutes les sociétés',
    description:
      'Permet de voir tous les contacts de toutes les entreprises (réservé aux administrateurs)',
    category: PERMISSION_CATEGORIES.GENERAL,
  },
];

// Regrouper les permissions par catégorie
export const PERMISSIONS_BY_CATEGORY = PERMISSIONS.reduce(
  (acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  },
  {} as Record<string, Permission[]>,
);

// Profils par défaut avec leurs permissions
export const DEFAULT_ROLES = {
  ADMIN: {
    name: 'Administrateur',
    description: 'Accès complet à toutes les fonctionnalités du système',
    permissions: PERMISSIONS.map((p) => p.code),
  },
  MANAGER: {
    name: 'Manager',
    description: "Gestion d'équipe et accès étendu aux leads",
    permissions: [
      'analytics.view',
      'contacts.view_all',
      'contacts.create',
      'contacts.edit_all',
      'contacts.assign',
      'contacts.import',
      'contacts.export',
      'contacts.view_files',
      'contacts.upload_files',
      'tasks.view_all',
      'tasks.create',
      'tasks.edit_all',
      'tasks.assign',
      'templates.view',
      'templates.create',
      'templates.edit',
      'templates.delete',
      'integrations.view',
      'users.view',
      'settings.view',
    ],
  },
  COMMERCIAL: {
    name: 'Commercial',
    description: 'Accès de base pour la gestion des leads personnels',
    permissions: [
      'contacts.view_own',
      'contacts.view_unassigned',
      'contacts.create',
      'contacts.edit_own',
      'contacts.view_files',
      'contacts.upload_files',
      'tasks.view_own',
      'tasks.create',
      'tasks.edit_own',
      'templates.view',
      'templates.create',
      'templates.edit',
      'integrations.view',
      'integrations.google.connect',
    ],
  },
  TELEPRO: {
    name: 'Télépro',
    description: 'Accès limité pour la qualification de leads',
    permissions: [
      'contacts.view_own',
      'contacts.view_unassigned',
      'contacts.create',
      'contacts.edit_own',
      'contacts.view_files',
      'tasks.view_own',
      'tasks.create',
      'tasks.edit_own',
      'templates.view',
    ],
  },
  COMPTABLE: {
    name: 'Comptable',
    description: 'Accès limité aux informations financières et reporting',
    permissions: [
      'analytics.view',
      'analytics.export',
      'contacts.view_all',
      'contacts.export',
      'tasks.view_all',
      'templates.view',
      'settings.view',
    ],
  },
};

// Helper pour vérifier si un rôle a une permission
export function hasPermission(rolePermissions: string[], requiredPermission: string): boolean {
  return rolePermissions.includes(requiredPermission);
}

// Helper pour obtenir toutes les permissions d'un rôle
export function getRolePermissions(role: string): string[] {
  const roleKey = role.toUpperCase() as keyof typeof DEFAULT_ROLES;
  return DEFAULT_ROLES[roleKey]?.permissions || [];
}
