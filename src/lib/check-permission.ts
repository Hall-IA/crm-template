import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';

/**
 * Vérifie si l'utilisateur actuel a une permission spécifique
 * @param requiredPermission - Code de la permission à vérifier
 * @returns true si l'utilisateur a la permission, false sinon
 */
export async function checkPermission(requiredPermission: string): Promise<boolean> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return false;
    }

    const userId = session.user.id;

    // Récupérer l'utilisateur avec son profil personnalisé si applicable
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        customRole: true,
      },
    });

    if (!user) {
      return false;
    }

    // Les permissions viennent uniquement du profil assigné
    if (!user.customRole) {
      // Aucun profil assigné = aucune permission
      return false;
    }

    const userPermissions = user.customRole.permissions as string[];

    // Vérifier si la permission est dans la liste
    return userPermissions.includes(requiredPermission);
  } catch (error) {
    console.error('Erreur lors de la vérification des permissions:', error);
    return false;
  }
}

/**
 * Vérifie si l'utilisateur actuel a plusieurs permissions
 * @param requiredPermissions - Tableau des codes de permissions à vérifier
 * @param requireAll - Si true, toutes les permissions sont requises. Si false, au moins une est requise
 * @returns true si l'utilisateur a les permissions, false sinon
 */
export async function checkPermissions(
  requiredPermissions: string[],
  requireAll: boolean = true,
): Promise<boolean> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return false;
    }

    const userId = session.user.id;

    // Récupérer l'utilisateur avec son profil personnalisé si applicable
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        customRole: true,
      },
    });

    if (!user) {
      return false;
    }

    // Les permissions viennent uniquement du profil assigné
    if (!user.customRole) {
      // Aucun profil assigné = aucune permission
      return false;
    }

    const userPermissions = user.customRole.permissions as string[];

    // Vérifier les permissions
    if (requireAll) {
      return requiredPermissions.every((perm) => userPermissions.includes(perm));
    } else {
      return requiredPermissions.some((perm) => userPermissions.includes(perm));
    }
  } catch (error) {
    console.error('Erreur lors de la vérification des permissions:', error);
    return false;
  }
}

/**
 * Récupère toutes les permissions de l'utilisateur actuel
 * @returns Tableau des codes de permissions de l'utilisateur
 */
export async function getUserPermissions(): Promise<string[]> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return [];
    }

    const userId = session.user.id;

    // Récupérer l'utilisateur avec son profil personnalisé si applicable
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        customRole: true,
      },
    });

    if (!user) {
      return [];
    }

    // Les permissions viennent uniquement du profil assigné
    if (!user.customRole) {
      // Aucun profil assigné = aucune permission
      return [];
    }

    return user.customRole.permissions as string[];
  } catch (error) {
    console.error('Erreur lors de la récupération des permissions:', error);
    return [];
  }
}

/**
 * Middleware pour protéger une route API avec des permissions
 * Exemple d'utilisation :
 *
 * export async function GET(req: NextRequest) {
 *   const hasPermission = await requirePermission('contacts.view_all');
 *   if (!hasPermission) {
 *     return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
 *   }
 *   // ... reste du code
 * }
 */
export async function requirePermission(requiredPermission: string): Promise<boolean> {
  return checkPermission(requiredPermission);
}

/**
 * Helper pour vérifier si un utilisateur est admin
 * Un admin est un utilisateur avec un profil ayant toutes les permissions
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return false;
    }

    const userId = session.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        customRole: true,
      },
    });

    if (!user || !user.customRole) {
      return false;
    }

    // Vérifier si le profil a la permission de gestion des utilisateurs
    const permissions = user.customRole.permissions as string[];
    return permissions.includes('users.manage_roles');
  } catch (error) {
    return false;
  }
}
