import { auth } from './auth';
import { prisma } from './prisma';

export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  COMMERCIAL = 'COMMERCIAL',
  TELEPRO = 'TELEPRO',
  COMPTABLE = 'COMPTABLE',
}

/**
 * Hiérarchie des rôles (du plus élevé au plus bas)
 * Un rôle supérieur a automatiquement les permissions des rôles inférieurs
 */
const ROLE_HIERARCHY: { [key: string]: number } = {
  [Role.ADMIN]: 1, // Niveau 1 : Le plus élevé
  [Role.MANAGER]: 2, // Niveau 2
  [Role.COMMERCIAL]: 3, // Niveau 3
  [Role.TELEPRO]: 4, // Niveau 4
  [Role.COMPTABLE]: 5, // Niveau 5
  [Role.USER]: 6, // Niveau 6 : Le plus bas
};

/**
 * Obtient le niveau hiérarchique d'un rôle
 */
function getRoleLevel(role: string): number {
  return ROLE_HIERARCHY[role] || 999; // Rôle inconnu = niveau très bas
}

/**
 * Vérifie si l'utilisateur a le rôle requis ou un rôle supérieur dans la hiérarchie
 * Un rôle supérieur a automatiquement les permissions des rôles inférieurs
 */
export function hasRole(userRole: string | undefined, requiredRole: Role): boolean {
  if (!userRole) return false;

  const userLevel = getRoleLevel(userRole);
  const requiredLevel = getRoleLevel(requiredRole);

  // L'utilisateur a le rôle requis s'il a le même rôle ou un rôle supérieur (niveau plus bas)
  return userLevel <= requiredLevel;
}

/**
 * Vérifie si l'utilisateur est admin
 */
export function isAdmin(userRole: string | undefined): boolean {
  return userRole === Role.ADMIN;
}

/**
 * Vérifie si l'utilisateur est manager ou supérieur
 */
export function isManagerOrAbove(userRole: string | undefined): boolean {
  if (!userRole) return false;
  return getRoleLevel(userRole) <= 2; // ADMIN ou MANAGER
}

/**
 * Vérifie si l'utilisateur est commercial ou supérieur
 */
export function isCommercialOrAbove(userRole: string | undefined): boolean {
  if (!userRole) return false;
  return getRoleLevel(userRole) <= 3; // ADMIN, MANAGER ou COMMERCIAL
}

/**
 * Vérifie si l'utilisateur est télépro ou supérieur
 */
export function isTeleproOrAbove(userRole: string | undefined): boolean {
  if (!userRole) return false;
  return getRoleLevel(userRole) <= 4; // ADMIN, MANAGER, COMMERCIAL ou TELEPRO
}

/**
 * Vérifie si l'utilisateur est comptable ou supérieur
 */
export function isComptableOrAbove(userRole: string | undefined): boolean {
  if (!userRole) return false;
  return getRoleLevel(userRole) <= 5; // ADMIN, MANAGER, COMMERCIAL, TELEPRO ou COMPTABLE
}

/**
 * Middleware pour vérifier le rôle côté serveur
 */
export async function requireRole(headers: Headers, requiredRole: Role) {
  const session = await auth.api.getSession({ headers });

  if (!session) {
    throw new Error('Non authentifié');
  }

  // Récupérer le rôle depuis la session ou depuis la base de données
  let userRole: string | undefined = (session.user as any).role;

  // Si le rôle n'est pas dans la session, le récupérer depuis la base de données
  if (!userRole && session.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    userRole = user?.role || undefined;
  }

  if (!hasRole(userRole, requiredRole)) {
    throw new Error('Permissions insuffisantes');
  }

  return session;
}

/**
 * Middleware pour vérifier si l'utilisateur est admin
 */
export async function requireAdmin(headers: Headers) {
  return requireRole(headers, Role.ADMIN);
}
