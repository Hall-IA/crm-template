import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from './lib/auth';
import { isAdmin } from './lib/roles';
import { prisma } from './lib/prisma';

// Routes qui nécessitent une authentification
const protectedRoutes = ['/dashboard', '/contacts', '/settings', '/users'];

// Routes réservées aux admins
const adminRoutes = ['/users'];

// Routes d'authentification
const authRoutes = ['/signin'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Vérifier la session en utilisant Better Auth
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  let isAuthenticated = !!session;
  let isActiveUser = true;
  
  // Récupérer le rôle depuis la session ou depuis la base de données
  let userRole: string | null = null;
  if (session && session.user?.id) {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, active: true },
    });

    userRole = (session.user as any).role || dbUser?.role || null;
    isActiveUser = dbUser?.active ?? true;
    if (!isActiveUser) {
      isAuthenticated = false;
    }
  }

  // Vérifier si la route actuelle est protégée
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  // Vérifier si la route est réservée aux admins
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));

  // Vérifier si la route actuelle est une route d'auth
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Si l'utilisateur n'est pas connecté et tente d'accéder à une route protégée
  if (!isAuthenticated && isProtectedRoute) {
    const signInUrl = new URL('/signin', request.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Si l'utilisateur est connecté mais n'est pas admin et tente d'accéder à une route admin
  if (isAuthenticated && isAdminRoute && !isAdmin(userRole || undefined)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Si l'utilisateur est connecté et tente d'accéder aux pages d'auth
  if (isAuthenticated && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
