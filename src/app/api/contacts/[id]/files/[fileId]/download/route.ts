import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getDownloadUrl } from '@/lib/google-drive';

// GET /api/contacts/[id]/files/[fileId]/download - Télécharger un fichier
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { id: contactId, fileId } = await params;

    // Vérifier que le contact existe
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
    });

    if (!contact) {
      return NextResponse.json({ error: 'Contact non trouvé' }, { status: 404 });
    }

    // Vérifier que le fichier existe et appartient au contact
    const file = await prisma.contactFile.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      return NextResponse.json({ error: 'Fichier non trouvé' }, { status: 404 });
    }

    if (file.contactId !== contactId) {
      return NextResponse.json({ error: 'Fichier non associé à ce contact' }, { status: 403 });
    }

    // Générer l'URL de téléchargement
    const downloadUrl = await getDownloadUrl(session.user.id, file.googleDriveFileId);

    // Rediriger vers l'URL de téléchargement
    return NextResponse.redirect(downloadUrl);
  } catch (error: any) {
    console.error('Erreur lors du téléchargement du fichier:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors du téléchargement du fichier' },
      { status: 500 },
    );
  }
}

