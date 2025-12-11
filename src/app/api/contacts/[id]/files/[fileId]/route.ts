import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { deleteFileFromDrive } from '@/lib/google-drive';
import { logFileDeleted } from '@/lib/contact-interactions';

// DELETE /api/contacts/[id]/files/[fileId] - Supprimer un fichier
export async function DELETE(
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

    // Vérifier les permissions (seul l'uploader ou un admin peut supprimer)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (file.uploadedById !== session.user.id && user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: "Vous n'avez pas la permission de supprimer ce fichier" },
        { status: 403 },
      );
    }

    // Sauvegarder les informations du fichier avant suppression pour l'interaction
    const fileName = file.fileName;
    const fileSize = file.fileSize;

    // Supprimer le fichier de Google Drive
    try {
      await deleteFileFromDrive(session.user.id, file.googleDriveFileId);
    } catch (error) {
      console.error('Erreur lors de la suppression du fichier de Google Drive:', error);
      // On continue quand même pour supprimer l'enregistrement en base
    }

    // Supprimer l'enregistrement de la base de données
    await prisma.contactFile.delete({
      where: { id: fileId },
    });

    // Créer une interaction pour la suppression du fichier
    try {
      await logFileDeleted(contactId, fileName, fileSize, session.user.id);
    } catch (interactionError: any) {
      console.error(
        "Erreur lors de la création de l'interaction de suppression:",
        interactionError,
      );
      // On continue même si l'interaction échoue
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erreur lors de la suppression du fichier:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la suppression du fichier' },
      { status: 500 },
    );
  }
}
