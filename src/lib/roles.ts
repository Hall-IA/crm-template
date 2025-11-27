import { auth } from "./auth";
import { prisma } from "./prisma";

export enum Role {
  USER = "USER",
  ADMIN = "ADMIN",
}

/**
 * Vérifie si l'utilisateur a le rôle requis
 */
export function hasRole(userRole: string | undefined, requiredRole: Role): boolean {
  if (!userRole) return false;
  
  // Les admins ont accès à tout
  if (userRole === Role.ADMIN) return true;
  
  return userRole === requiredRole;
}

/**
 * Vérifie si l'utilisateur est admin
 */
export function isAdmin(userRole: string | undefined): boolean {
  return userRole === Role.ADMIN;
}

/**
 * Middleware pour vérifier le rôle côté serveur
 */
export async function requireRole(headers: Headers, requiredRole: Role) {
  const session = await auth.api.getSession({ headers });

  if (!session) {
    throw new Error("Non authentifié");
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
    throw new Error("Permissions insuffisantes");
  }

  return session;
}

/**
 * Middleware pour vérifier si l'utilisateur est admin
 */
export async function requireAdmin(headers: Headers) {
  return requireRole(headers, Role.ADMIN);
}

