import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadFileToDrive, getFileInfo } from '@/lib/google-drive';
import { logFileUploaded, logFileReplaced } from '@/lib/contact-interactions';

// POST /api/contacts/[id]/files - Uploader un fichier
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { id: contactId } = await params;

    // Vérifier que le contact existe
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!contact) {
      return NextResponse.json({ error: 'Contact non trouvé' }, { status: 404 });
    }

    // Vérifier que l'utilisateur a un compte Google connecté
    const googleAccount = await prisma.userGoogleAccount.findUnique({
      where: { userId: session.user.id },
    });

    if (!googleAccount) {
      return NextResponse.json(
        { error: 'Aucun compte Google connecté. Veuillez connecter votre compte Google dans les paramètres.' },
        { status: 400 },
      );
    }

    // Récupérer le FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    // Vérifier la taille du fichier (max 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Le fichier est trop volumineux. Taille maximale: 100MB' },
        { status: 400 },
      );
    }

    // Nom du contact pour le dossier
    const contactName = `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || `Contact ${contactId}`;

    // Vérifier si un fichier avec le même nom existe déjà pour ce contact
    const existingFile = await prisma.contactFile.findFirst({
      where: {
        contactId,
        fileName: file.name,
      },
    });

    let contactFile;

    if (existingFile) {
      // Si le fichier existe déjà, supprimer l'ancien fichier de Google Drive
      try {
        const { deleteFileFromDrive } = await import('@/lib/google-drive');
        await deleteFileFromDrive(session.user.id, existingFile.googleDriveFileId);
      } catch (error) {
        console.error('Erreur lors de la suppression de l\'ancien fichier:', error);
        // On continue même si la suppression échoue
      }

      // Uploader le nouveau fichier vers Google Drive
      const { fileId } = await uploadFileToDrive(
        session.user.id,
        contactId,
        contactName,
        file,
      );

      // Mettre à jour l'enregistrement existant
      contactFile = await prisma.contactFile.update({
        where: { id: existingFile.id },
        data: {
          fileSize: file.size,
          mimeType: file.type || 'application/octet-stream',
          googleDriveFileId: fileId,
          uploadedById: session.user.id,
          updatedAt: new Date(),
        },
        include: {
          uploadedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Créer une interaction pour le remplacement du fichier
      try {
        await logFileReplaced(
          contactId,
          contactFile.id,
          file.name,
          file.size,
          session.user.id,
        );
      } catch (interactionError: any) {
        console.error(
          "Erreur lors de la création de l'interaction de remplacement:",
          interactionError,
        );
        // On continue même si l'interaction échoue
      }
    } else {
      // Uploader le fichier vers Google Drive
      const { fileId } = await uploadFileToDrive(
        session.user.id,
        contactId,
        contactName,
        file,
      );

      // Créer un nouvel enregistrement dans la base de données
      contactFile = await prisma.contactFile.create({
        data: {
          contactId,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type || 'application/octet-stream',
          googleDriveFileId: fileId,
          uploadedById: session.user.id,
        },
        include: {
          uploadedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Créer une interaction pour l'upload du fichier (seulement si c'est un nouveau fichier)
      try {
        await logFileUploaded(
          contactId,
          contactFile.id,
          file.name,
          file.size,
          session.user.id,
        );
      } catch (interactionError: any) {
        console.error(
          "Erreur lors de la création de l'interaction d'upload:",
          interactionError,
        );
        // On continue même si l'interaction échoue
      }
    }

    // Récupérer le webViewLink pour la réponse
    const fileInfo = await getFileInfo(session.user.id, contactFile.googleDriveFileId);
    const webViewLink = fileInfo.webViewLink;

    return NextResponse.json({
      id: contactFile.id,
      fileName: contactFile.fileName,
      fileSize: contactFile.fileSize,
      mimeType: contactFile.mimeType,
      webViewLink,
      uploadedBy: contactFile.uploadedBy,
      createdAt: contactFile.createdAt,
    });
  } catch (error: any) {
    console.error('Erreur lors de l\'upload du fichier:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de l\'upload du fichier' },
      { status: 500 },
    );
  }
}

// GET /api/contacts/[id]/files - Lister les fichiers d'un contact
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { id: contactId } = await params;

    // Vérifier que le contact existe
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
    });

    if (!contact) {
      return NextResponse.json({ error: 'Contact non trouvé' }, { status: 404 });
    }

    // Récupérer tous les fichiers du contact
    const files = await prisma.contactFile.findMany({
      where: { contactId },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Pour chaque fichier, récupérer le lien de visualisation depuis Google Drive
    const filesWithLinks = await Promise.all(
      files.map(async (file) => {
        try {
          const googleAccount = await prisma.userGoogleAccount.findUnique({
            where: { userId: session.user.id },
          });

          if (googleAccount) {
            const fileInfo = await getFileInfo(session.user.id, file.googleDriveFileId);
            return {
              id: file.id,
              fileName: file.fileName,
              fileSize: file.fileSize,
              mimeType: file.mimeType,
              webViewLink: fileInfo.webViewLink,
              uploadedBy: file.uploadedBy,
              createdAt: file.createdAt,
            };
          }
        } catch (error) {
          console.error(`Erreur lors de la récupération du lien pour le fichier ${file.id}:`, error);
        }

        return {
          id: file.id,
          fileName: file.fileName,
          fileSize: file.fileSize,
          mimeType: file.mimeType,
          webViewLink: `https://drive.google.com/file/d/${file.googleDriveFileId}/view`,
          uploadedBy: file.uploadedBy,
          createdAt: file.createdAt,
        };
      }),
    );

    return NextResponse.json(filesWithLinks);
  } catch (error: any) {
    console.error('Erreur lors de la récupération des fichiers:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération des fichiers' },
      { status: 500 },
    );
  }
}

