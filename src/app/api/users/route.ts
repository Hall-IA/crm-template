import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/roles";
import { auth } from "@/lib/auth";

// GET /api/users - Liste tous les utilisateurs (admin seulement)
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request.headers);

    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    // Mapper les utilisateurs avec le rôle
    const usersWithRole = users.map((user: any) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || "USER",
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      image: user.image,
    }));

    return NextResponse.json(usersWithRole);
  } catch (error: any) {
    console.error("Erreur lors de la récupération des utilisateurs:", error);
    
    if (error.message === "Non authentifié") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    
    if (error.message === "Permissions insuffisantes") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
    
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// POST /api/users - Créer un nouvel utilisateur (admin seulement)
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request.headers);
    
    const body = await request.json();
    const { name, email, password, role = "USER" } = body;

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Nom, email et mot de passe requis" },
        { status: 400 }
      );
    }

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Cet email est déjà utilisé" },
        { status: 400 }
      );
    }

    // Utiliser l'API de Better Auth pour créer l'utilisateur avec le mot de passe
    // Cela garantit que le mot de passe est haché correctement selon le format de Better Auth
    const signUpResult = await auth.api.signUpEmail({
      body: {
        name,
        email,
        password,
      },
      headers: request.headers,
    });

    if (!signUpResult || !signUpResult.user) {
      return NextResponse.json(
        { error: "Erreur lors de la création de l'utilisateur" },
        { status: 500 }
      );
    }

    // Mettre à jour le rôle de l'utilisateur créé
    const user = await prisma.user.update({
      where: { id: signUpResult.user.id },
      data: {
        role: role as any,
        emailVerified: true, // Auto-vérifié par l'admin
      },
    });

    // Retourner l'utilisateur avec le rôle
    const userWithRole = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: (user as any).role || "USER",
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    };

    return NextResponse.json(userWithRole, { status: 201 });
  } catch (error: any) {
    console.error("Erreur lors de la création de l'utilisateur:", error);
    
    if (error.message === "Non authentifié") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    
    if (error.message === "Permissions insuffisantes") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Gérer les erreurs spécifiques de Better Auth
    if (error.message?.includes("email") || error.message?.includes("Email") || error.message?.includes("already exists")) {
      return NextResponse.json(
        { error: "Cet email est déjà utilisé" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}

