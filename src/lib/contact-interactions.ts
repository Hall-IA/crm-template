import { prisma } from '@/lib/prisma';
import { InteractionType } from '../../generated/prisma/client';

interface CreateInteractionParams {
  contactId: string;
  type: InteractionType;
  title?: string | null;
  content: string;
  userId: string;
  date?: Date | null;
  metadata?: Record<string, any>;
}

/**
 * Crée une interaction pour un contact
 */
export async function createInteraction(params: CreateInteractionParams) {
  const { contactId, type, title, content, userId, date, metadata } = params;

  return await prisma.interaction.create({
    data: {
      contactId,
      type,
      title: title ?? null,
      content,
      userId,
      date: date ?? null,
      metadata: metadata ?? undefined,
    },
  });
}

/**
 * Crée une interaction pour un changement de statut
 */
export async function logStatusChange(
  contactId: string,
  oldStatusId: string | null,
  newStatusId: string | null,
  userId: string,
  oldStatusName?: string | null,
  newStatusName?: string | null,
) {
  const oldStatus = oldStatusName || 'Aucun';
  const newStatus = newStatusName || 'Aucun';

  return await createInteraction({
    contactId,
    type: 'STATUS_CHANGE',
    title: 'Changement de statut',
    content: `Statut modifié de "${oldStatus}" à "${newStatus}"`,
    userId,
    metadata: {
      oldStatusId,
      newStatusId,
      oldStatusName,
      newStatusName,
    },
  });
}

/**
 * Crée une interaction pour une mise à jour de contact
 */
export async function logContactUpdate(
  contactId: string,
  changes: Record<string, { old: any; new: any }>,
  userId: string,
) {
  const changeDescriptions: string[] = [];

  for (const [field, { old, new: newValue }] of Object.entries(changes)) {
    const fieldNames: Record<string, string> = {
      firstName: 'Prénom',
      lastName: 'Nom',
      phone: 'Téléphone',
      secondaryPhone: 'Téléphone secondaire',
      email: 'Email',
      address: 'Adresse',
      city: 'Ville',
      postalCode: 'Code postal',
      civility: 'Civilité',
      origin: 'Origine',
      companyName: 'Entreprise',
    };

    const fieldName = fieldNames[field] || field;
    const oldValue = old !== null && old !== undefined ? String(old) : 'Aucun';
    const newValueStr = newValue !== null && newValue !== undefined ? String(newValue) : 'Aucun';

    if (oldValue !== newValueStr) {
      changeDescriptions.push(`${fieldName}: "${oldValue}" → "${newValueStr}"`);
    }
  }

  if (changeDescriptions.length === 0) {
    return null;
  }

  return await createInteraction({
    contactId,
    type: 'CONTACT_UPDATE',
    title: 'Modification de la fiche contact',
    content: changeDescriptions.join('\n'),
    userId,
    metadata: { changes },
  });
}

/**
 * Crée une interaction pour un changement d'assignation
 */
export async function logAssignmentChange(
  contactId: string,
  type: 'COMMERCIAL' | 'TELEPRO',
  oldUserId: string | null,
  newUserId: string | null,
  userId: string,
  oldUserName?: string | null,
  newUserName?: string | null,
) {
  // Normaliser les valeurs pour la comparaison (null, undefined, '' sont considérés comme équivalents)
  const normalizedOldUserId = oldUserId || null;
  const normalizedNewUserId = newUserId || null;

  // Ne créer l'interaction que si les valeurs ont réellement changé
  if (normalizedOldUserId === normalizedNewUserId) {
    return null;
  }

  const roleName = type === 'COMMERCIAL' ? 'Commercial' : 'Télépro';
  const oldName = oldUserName || 'Non attribué';
  const newName = newUserName || 'Non attribué';

  return await createInteraction({
    contactId,
    type: 'ASSIGNMENT_CHANGE',
    title: `Changement d'assignation ${roleName}`,
    content: `${roleName} modifié de "${oldName}" à "${newName}"`,
    userId,
    metadata: {
      assignmentType: type,
      oldUserId,
      newUserId,
      oldUserName,
      newUserName,
    },
  });
}

/**
 * Crée une interaction pour la création d'un rendez-vous
 */
export async function logAppointmentCreated(
  contactId: string,
  taskId: string,
  scheduledAt: Date,
  title: string | null,
  userId: string,
) {
  const formattedDate = scheduledAt.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return await createInteraction({
    contactId,
    type: 'APPOINTMENT_CREATED',
    title: title ?? null, // Enregistrer seulement le titre
    content: `Rendez-vous programmé le ${formattedDate}`,
    userId,
    date: scheduledAt,
    metadata: {
      taskId,
      scheduledAt: scheduledAt.toISOString(),
    },
  });
}

/**
 * Crée une interaction pour l'annulation d'un rendez-vous
 */
export async function logAppointmentCancelled(
  contactId: string,
  taskId: string,
  scheduledAt: Date,
  title: string | null,
  userId: string,
  isGoogleMeet: boolean = false,
) {
  const formattedDate = scheduledAt.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const appointmentType = isGoogleMeet ? 'Google Meet' : 'Rendez-vous';

  return await createInteraction({
    contactId,
    type: 'APPOINTMENT_DELETED',
    title: title ?? null, // Enregistrer seulement le titre
    content: `${appointmentType} prévu le ${formattedDate} a été annulé.`,
    userId,
    date: scheduledAt,
    metadata: {
      taskId,
      scheduledAt: scheduledAt.toISOString(),
      cancelled: true,
      isGoogleMeet,
    },
  });
}

/**
 * Crée une interaction pour la modification d'un rendez-vous
 */
export async function logAppointmentChanged(
  contactId: string,
  taskId: string,
  scheduledAt: Date,
  title: string | null,
  userId: string,
  isGoogleMeet: boolean = false,
) {
  const formattedDate = scheduledAt.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const appointmentType = isGoogleMeet ? 'Google Meet' : 'Rendez-vous';

  return await createInteraction({
    contactId,
    type: 'APPOINTMENT_CHANGED',
    title: title ?? null, // Enregistrer seulement le titre
    content: `${appointmentType} programmé le ${formattedDate} a été modifié.`,
    userId,
    date: scheduledAt,
    metadata: {
      taskId,
      scheduledAt: scheduledAt.toISOString(),
      isGoogleMeet,
    },
  });
}

/**
 * Crée une interaction pour l'upload d'un fichier
 */
export async function logFileUploaded(
  contactId: string,
  fileId: string,
  fileName: string,
  fileSize: number,
  userId: string,
) {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return await createInteraction({
    contactId,
    type: 'NOTE',
    title: `Fichier ajouté (${fileName})`,
    content: `Fichier "${fileName}" (${formatFileSize(fileSize)}) a été ajouté.`,
    userId,
    metadata: {
      fileId,
      fileName,
      fileSize,
    },
  });
}

/**
 * Crée une interaction pour le remplacement d'un fichier (doublon)
 */
export async function logFileReplaced(
  contactId: string,
  fileId: string,
  fileName: string,
  fileSize: number,
  userId: string,
) {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return await createInteraction({
    contactId,
    type: 'NOTE',
    title: `Fichier remplacé (${fileName})`,
    content: `Le fichier "${fileName}" (${formatFileSize(fileSize)}) a été remplacé par une nouvelle version.`,
    userId,
    metadata: {
      fileId,
      fileName,
      fileSize,
      replaced: true,
    },
  });
}

/**
 * Crée une interaction pour la suppression d'un fichier
 */
export async function logFileDeleted(
  contactId: string,
  fileName: string,
  fileSize: number,
  userId: string,
) {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return await createInteraction({
    contactId,
    type: 'NOTE',
    title: `Fichier supprimé (${fileName})`,
    content: `Le fichier "${fileName}" (${formatFileSize(fileSize)}) a été supprimé.`,
    userId,
    metadata: {
      fileName,
      fileSize,
      deleted: true,
    },
  });
}
