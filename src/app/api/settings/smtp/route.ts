import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/encryption';

// GET /api/settings/smtp - Récupérer la configuration SMTP de l'utilisateur
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const smtpConfig = await prisma.smtpConfig.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        host: true,
        port: true,
        secure: true,
        username: true,
        fromEmail: true,
        fromName: true,
        signature: true,
        // Ne pas retourner le mot de passe
      },
    });

    return NextResponse.json(smtpConfig || null);
  } catch (error: any) {
    console.error('Erreur lors de la récupération de la config SMTP:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PUT /api/settings/smtp - Sauvegarder ou mettre à jour la configuration SMTP
export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const { host, port, secure, username, password, fromEmail, fromName, signature } = body;

    // Validation
    if (!host || !port || !username || !password || !fromEmail) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis (host, port, username, password, fromEmail)' },
        { status: 400 },
      );
    }

    if (port < 1 || port > 65535) {
      return NextResponse.json({ error: 'Le port doit être entre 1 et 65535' }, { status: 400 });
    }

    // Chiffrer le mot de passe avant stockage
    let encryptedPassword: string;
    try {
      encryptedPassword = encrypt(password);
    } catch (encryptError: any) {
      console.error('Erreur lors du chiffrement du mot de passe:', encryptError);
      return NextResponse.json(
        { error: `Erreur de chiffrement: ${encryptError.message}` },
        { status: 500 },
      );
    }

    // Créer ou mettre à jour la configuration SMTP
    let smtpConfig;
    try {
      smtpConfig = await prisma.smtpConfig.upsert({
        where: { userId: session.user.id },
        update: {
          host,
          port: parseInt(port),
          secure: secure === true || secure === 'true',
          username,
          password: encryptedPassword, // Mot de passe chiffré
          fromEmail,
          fromName: fromName || null,
          signature: signature || null,
        },
        create: {
          userId: session.user.id,
          host,
          port: parseInt(port),
          secure: secure === true || secure === 'true',
          username,
          password: encryptedPassword, // Mot de passe chiffré
          fromEmail,
          fromName: fromName || null,
          signature: signature || null,
        },
      });
    } catch (dbError: any) {
      console.error('Erreur lors de la sauvegarde en base de données:', dbError);
      return NextResponse.json(
        { error: `Erreur de base de données: ${dbError.message}` },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      config: {
        id: smtpConfig.id,
        host: smtpConfig.host,
        port: smtpConfig.port,
        secure: smtpConfig.secure,
        username: smtpConfig.username,
        fromEmail: smtpConfig.fromEmail,
        fromName: smtpConfig.fromName,
        signature: smtpConfig.signature,
      },
      message: 'Configuration SMTP sauvegardée avec succès',
    });
  } catch (error: any) {
    console.error('Erreur lors de la sauvegarde de la config SMTP:', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}
