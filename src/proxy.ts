import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "./lib/auth";

// Routes qui nécessitent une authentification
const protectedRoutes = ["/dashboard", "/contacts", "/settings"];

// Routes d'authentification
const authRoutes = ["/signin", "/signup"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Vérifier la session en utilisant Better Auth
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  const isAuthenticated = !!session;

  // Vérifier si la route actuelle est protégée
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Vérifier si la route actuelle est une route d'auth
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Si l'utilisateur n'est pas connecté et tente d'accéder à une route protégée
  if (!isAuthenticated && isProtectedRoute) {
    const signInUrl = new URL("/signin", request.url);
    // Optionnel : ajouter l'URL de retour après connexion
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Si l'utilisateur est connecté et tente d'accéder aux pages d'auth
  if (isAuthenticated && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
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
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};

