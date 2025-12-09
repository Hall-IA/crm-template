import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/roles';

// GET /api/users - Liste tous les utilisateurs (admin seulement)
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request.headers);

    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Mapper les utilisateurs avec le rôle
    const usersWithRole = users.map((user: any) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || 'USER',
      emailVerified: user.emailVerified,
      active: user.active,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      image: user.image,
    }));

    return NextResponse.json(usersWithRole);
  } catch (error: any) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);

    if (error.message === 'Non authentifié') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (error.message === 'Permissions insuffisantes') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/users - Créer un nouvel utilisateur (admin seulement)
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request.headers);

    const body = await request.json();
    const { name, email, role = 'USER' } = body;

    // Validation
    if (!name || !email) {
      return NextResponse.json({ error: 'Nom et email requis' }, { status: 400 });
    }

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: {
        accounts: {
          where: { providerId: 'credential' },
        },
      },
    });

    if (existingUser) {
      // Si l'utilisateur existe déjà avec un compte, erreur
      if (existingUser.accounts.length > 0) {
        return NextResponse.json({ error: 'Cet email est déjà utilisé' }, { status: 400 });
      }
      // Si l'utilisateur existe mais sans compte, on peut régénérer un token
    }

    let user;
    if (existingUser && existingUser.accounts.length === 0) {
      // Utilisateur existe déjà sans compte, on met à jour et régénère le token
      user = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name,
          role: role,
          active: true,
        },
      });
    } else {
      // Créer l'utilisateur SANS mot de passe (sans Account)
      user = await prisma.user.create({
        data: {
          id: crypto.randomUUID(),
          name,
          email,
          role: role,
          emailVerified: false, // Pas encore vérifié
          active: true,
        },
      });
    }

    // Générer un token d'invitation
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1); // Valide 1 jour

    // Supprimer les anciens tokens pour cet email
    await prisma.verification.deleteMany({
      where: {
        identifier: email,
      },
    });

    // Créer le nouveau token
    await prisma.verification.create({
      data: {
        id: crypto.randomUUID(),
        identifier: email,
        value: token,
        expiresAt,
      },
    });

    // Envoyer l'email d'invitation
    const baseUrl = process.env.BETTER_AUTH_URL || 'http://localhost:3000';
    const invitationUrl = `${baseUrl}/invite/${token}`;

    try {
      // Transmettre les cookies de session pour que /api/send puisse identifier l'utilisateur connecté
      const cookieHeader = request.headers.get('cookie') || '';
      const emailResponse = await fetch(`${baseUrl}/api/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookieHeader,
        },
        body: JSON.stringify({
          to: email,
          subject: 'Invitation à rejoindre le CRM',
          template: 'invitation',
          invitationUrl,
          name,
        }),
      });

      if (!emailResponse.ok) {
        const errorData = await emailResponse.json().catch(() => ({}));
        console.error("❌ Erreur lors de l'envoi de l'email:", {
          status: emailResponse.status,
          statusText: emailResponse.statusText,
          error: errorData,
        });
      } else {
        const successData = await emailResponse.json().catch(() => ({}));
        console.log("✅ Email d'invitation envoyé avec succès:", successData);
      }
    } catch (emailError: any) {
      console.error("❌ Erreur lors de l'envoi de l'email:", emailError);
      console.error('Détails:', {
        message: emailError.message,
        stack: emailError.stack,
      });
      // On continue même si l'email échoue, l'utilisateur est créé
    }

    return NextResponse.json(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || 'USER',
        emailVerified: user.emailVerified,
        active: user.active,
        createdAt: user.createdAt,
        message: "Utilisateur créé, email d'invitation envoyé",
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Erreur lors de la création de l'utilisateur:", error);

    if (error.message === 'Non authentifié') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (error.message === 'Permissions insuffisantes') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Gérer les erreurs spécifiques
    if (
      error.message?.includes('email') ||
      error.message?.includes('Email') ||
      error.message?.includes('already exists')
    ) {
      return NextResponse.json({ error: 'Cet email est déjà utilisé' }, { status: 400 });
    }

    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}
