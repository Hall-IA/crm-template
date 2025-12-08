import { prisma } from "@/lib/prisma";
import { InteractionType } from "../../generated/prisma/client";

interface CreateInteractionParams {
  contactId: string;
  type: InteractionType;
  title?: string;
  content: string;
  userId: string;
  date?: Date;
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
      title: title || null,
      content,
      userId,
      date: date || null,
      metadata: metadata || undefined,
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
  newStatusName?: string | null
) {
  const oldStatus = oldStatusName || "Aucun";
  const newStatus = newStatusName || "Aucun";

  return await createInteraction({
    contactId,
    type: "STATUS_CHANGE",
    title: "Changement de statut",
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
  userId: string
) {
  const changeDescriptions: string[] = [];

  for (const [field, { old, new: newValue }] of Object.entries(changes)) {
    const fieldNames: Record<string, string> = {
      firstName: "Prénom",
      lastName: "Nom",
      phone: "Téléphone",
      secondaryPhone: "Téléphone secondaire",
      email: "Email",
      address: "Adresse",
      city: "Ville",
      postalCode: "Code postal",
      civility: "Civilité",
      origin: "Origine",
    };

    const fieldName = fieldNames[field] || field;
    const oldValue = old !== null && old !== undefined ? String(old) : "Aucun";
    const newValueStr =
      newValue !== null && newValue !== undefined ? String(newValue) : "Aucun";

    if (oldValue !== newValueStr) {
      changeDescriptions.push(
        `${fieldName}: "${oldValue}" → "${newValueStr}"`
      );
    }
  }

  if (changeDescriptions.length === 0) {
    return null;
  }

  return await createInteraction({
    contactId,
    type: "CONTACT_UPDATE",
    title: "Modification de la fiche contact",
    content: changeDescriptions.join("\n"),
    userId,
    metadata: { changes },
  });
}

/**
 * Crée une interaction pour un changement d'assignation
 */
export async function logAssignmentChange(
  contactId: string,
  type: "COMMERCIAL" | "TELEPRO",
  oldUserId: string | null,
  newUserId: string | null,
  userId: string,
  oldUserName?: string | null,
  newUserName?: string | null
) {
  const roleName = type === "COMMERCIAL" ? "Commercial" : "Télépro";
  const oldName = oldUserName || "Non attribué";
  const newName = newUserName || "Non attribué";

  return await createInteraction({
    contactId,
    type: "ASSIGNMENT_CHANGE",
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
  userId: string
) {
  const formattedDate = scheduledAt.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return await createInteraction({
    contactId,
    type: "APPOINTMENT_CREATED",
    title: title || "Rendez-vous créé",
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
  isGoogleMeet: boolean = false
) {
  const formattedDate = scheduledAt.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const appointmentType = isGoogleMeet ? "Google Meet" : "Rendez-vous";
  const appointmentTitle = title || appointmentType;

  return await createInteraction({
    contactId,
    type: "MEETING",
    title: `${appointmentType} annulé : ${appointmentTitle}`,
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

