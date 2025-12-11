/**
 * Utilitaires pour gérer les fichiers avec Google Drive API
 */

import { prisma } from '@/lib/prisma';
import { getValidAccessToken } from './google-calendar';

// Nom de l'application (peut être configuré via variable d'environnement)
const APP_NAME = process.env.APP_NAME || 'CRM Template';

/**
 * Crée ou récupère un dossier dans Google Drive
 */
async function getOrCreateFolder(
  accessToken: string,
  folderName: string,
  parentId?: string,
): Promise<string> {
  // Construire la requête de recherche
  // Important: Ne pas encoder le nom dans les guillemets, mais échapper les guillemets simples dans le nom
  // Google Drive API attend le nom tel quel, pas encodé
  const escapedName = folderName.replace(/'/g, "\\'");
  let query = `name='${escapedName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  if (parentId) {
    query += ` and '${parentId}' in parents`;
  } else {
    // Pour la racine, on cherche les dossiers qui n'ont pas de parents (ou qui ont 'root' comme parent)
    query += ` and 'root' in parents`;
  }

  // Chercher si le dossier existe déjà
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,parents)&pageSize=10`;
  const searchResponse = await fetch(searchUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!searchResponse.ok) {
    const errorText = await searchResponse.text();
    throw new Error(`Erreur lors de la recherche du dossier: ${errorText}`);
  }

  const searchData = await searchResponse.json();

  // Si le dossier existe, vérifier qu'il est bien dans le bon parent
  if (searchData.files && searchData.files.length > 0) {
    // Si on cherche à la racine, vérifier que le dossier est bien à la racine
    if (!parentId) {
      // Vérifier que le dossier est bien à la racine (parents contient 'root' ou est vide)
      const rootFolder = searchData.files.find((file: any) => {
        if (!file.parents || file.parents.length === 0) return true;
        // Vérifier si le dossier est directement à la racine
        return file.parents.length === 1 && file.parents[0] === 'root';
      });

      if (rootFolder) {
        return rootFolder.id;
      }

      // Si aucun n'est exactement à la racine, prendre le premier
      return searchData.files[0].id;
    }

    // Si on cherche dans un parent spécifique, vérifier que le dossier est bien dans ce parent
    const matchingFolder = searchData.files.find(
      (file: any) => file.parents && file.parents.includes(parentId),
    );

    if (matchingFolder) {
      return matchingFolder.id;
    }

    // Si aucun ne correspond exactement, prendre le premier (cas de migration)
    return searchData.files[0].id;
  }

  // Sinon, créer le dossier
  const folderData: any = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };

  if (parentId) {
    folderData.parents = [parentId];
  } else {
    // Pour la racine, on spécifie explicitement 'root' comme parent
    folderData.parents = ['root'];
  }

  const createResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(folderData),
  });

  if (!createResponse.ok) {
    const error = await createResponse.json();
    throw new Error(`Erreur lors de la création du dossier: ${JSON.stringify(error)}`);
  }

  const createdData = await createResponse.json();
  return createdData.id;
}

/**
 * Crée un dossier dans Google Drive pour un contact
 * Structure: CRM Template > Contacts > Contact - [Nom]
 * Retourne l'ID du dossier créé ou existant
 */
export async function getOrCreateContactFolder(
  userId: string,
  contactId: string,
  contactName: string,
): Promise<string> {
  const googleAccount = await prisma.userGoogleAccount.findUnique({
    where: { userId },
  });

  if (!googleAccount) {
    throw new Error('Aucun compte Google connecté');
  }

  const accessToken = await getValidAccessToken(
    googleAccount.accessToken,
    googleAccount.refreshToken,
    googleAccount.tokenExpiresAt,
  );

  // Mettre à jour le token si nécessaire
  if (accessToken !== googleAccount.accessToken) {
    const tokenExpiresAt = new Date();
    tokenExpiresAt.setSeconds(tokenExpiresAt.getSeconds() + 3600);
    await prisma.userGoogleAccount.update({
      where: { userId },
      data: {
        accessToken,
        tokenExpiresAt,
      },
    });
  }

  // 1. Créer ou récupérer le dossier racine "CRM Template"
  const appFolderId = await getOrCreateFolder(accessToken, APP_NAME);

  // 2. Créer ou récupérer le dossier "Contacts" dans "CRM Template"
  const contactsFolderId = await getOrCreateFolder(accessToken, 'Contacts', appFolderId);

  // 3. Créer ou récupérer le dossier du contact dans "Contacts"
  const contactFolderName = `Contact - ${contactName || contactId}`;
  const contactFolderId = await getOrCreateFolder(accessToken, contactFolderName, contactsFolderId);

  return contactFolderId;
}

/**
 * Upload un fichier vers Google Drive dans le dossier du contact
 */
export async function uploadFileToDrive(
  userId: string,
  contactId: string,
  contactName: string,
  file: File,
): Promise<{ fileId: string; webViewLink: string }> {
  const folderId = await getOrCreateContactFolder(userId, contactId, contactName);

  const googleAccount = await prisma.userGoogleAccount.findUnique({
    where: { userId },
  });

  if (!googleAccount) {
    throw new Error('Aucun compte Google connecté');
  }

  const accessToken = await getValidAccessToken(
    googleAccount.accessToken,
    googleAccount.refreshToken,
    googleAccount.tokenExpiresAt,
  );

  // Mettre à jour le token si nécessaire
  if (accessToken !== googleAccount.accessToken) {
    const tokenExpiresAt = new Date();
    tokenExpiresAt.setSeconds(tokenExpiresAt.getSeconds() + 3600);
    await prisma.userGoogleAccount.update({
      where: { userId },
      data: {
        accessToken,
        tokenExpiresAt,
      },
    });
  }

  // Vérifier si un fichier avec le même nom existe déjà dans le dossier
  const searchQuery = `name='${encodeURIComponent(file.name)}' and '${folderId}' in parents and trashed=false`;
  const searchResponse = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(searchQuery)}&fields=files(id,name,webViewLink)`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (searchResponse.ok) {
    const searchData = await searchResponse.json();
    // Si un fichier avec le même nom existe déjà, le supprimer avant d'uploader le nouveau
    if (searchData.files && searchData.files.length > 0) {
      for (const existingFile of searchData.files) {
        try {
          await fetch(`https://www.googleapis.com/drive/v3/files/${existingFile.id}`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });
        } catch (error) {
          // Ignorer l'erreur de suppression du fichier existant
        }
      }
    }
  }

  // Créer les métadonnées du fichier
  const metadata = {
    name: file.name,
    parents: [folderId],
  };

  // Créer le FormData pour l'upload multipart
  const formData = new FormData();
  formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  formData.append('file', file);

  // Upload le fichier
  const uploadResponse = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    },
  );

  if (!uploadResponse.ok) {
    const error = await uploadResponse.json();
    throw new Error(`Erreur lors de l'upload: ${JSON.stringify(error)}`);
  }

  const fileData = await uploadResponse.json();
  return {
    fileId: fileData.id,
    webViewLink: fileData.webViewLink || `https://drive.google.com/file/d/${fileData.id}/view`,
  };
}

/**
 * Récupère les informations d'un fichier depuis Google Drive
 */
export async function getFileInfo(
  userId: string,
  fileId: string,
): Promise<{ name: string; size: string; mimeType: string; webViewLink: string }> {
  const googleAccount = await prisma.userGoogleAccount.findUnique({
    where: { userId },
  });

  if (!googleAccount) {
    throw new Error('Aucun compte Google connecté');
  }

  const accessToken = await getValidAccessToken(
    googleAccount.accessToken,
    googleAccount.refreshToken,
    googleAccount.tokenExpiresAt,
  );

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,size,mimeType,webViewLink`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error('Erreur lors de la récupération du fichier');
  }

  return await response.json();
}

/**
 * Supprime un fichier de Google Drive
 */
export async function deleteFileFromDrive(userId: string, fileId: string): Promise<void> {
  const googleAccount = await prisma.userGoogleAccount.findUnique({
    where: { userId },
  });

  if (!googleAccount) {
    throw new Error('Aucun compte Google connecté');
  }

  const accessToken = await getValidAccessToken(
    googleAccount.accessToken,
    googleAccount.refreshToken,
    googleAccount.tokenExpiresAt,
  );

  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok && response.status !== 404) {
    // 404 signifie que le fichier n'existe plus, ce qui est OK
    throw new Error('Erreur lors de la suppression du fichier');
  }
}

/**
 * Génère une URL de téléchargement temporaire pour un fichier
 */
export async function getDownloadUrl(userId: string, fileId: string): Promise<string> {
  const googleAccount = await prisma.userGoogleAccount.findUnique({
    where: { userId },
  });

  if (!googleAccount) {
    throw new Error('Aucun compte Google connecté');
  }

  const accessToken = await getValidAccessToken(
    googleAccount.accessToken,
    googleAccount.refreshToken,
    googleAccount.tokenExpiresAt,
  );

  // Pour les fichiers Google Docs/Sheets/Slides, on doit exporter
  const fileInfo = await getFileInfo(userId, fileId);

  // Si c'est un fichier Google Workspace, on retourne le lien de visualisation
  if (fileInfo.mimeType.startsWith('application/vnd.google-apps.')) {
    return fileInfo.webViewLink;
  }

  // Retourner l'URL de téléchargement directe avec le token
  return `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&access_token=${accessToken}`;
}
