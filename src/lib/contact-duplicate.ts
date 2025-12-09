import { prisma } from '@/lib/prisma';

/**
 * Détecte et gère les doublons de contacts basés sur nom, prénom ET email
 * Si un doublon est trouvé :
 * - Change le statut en "Doublon"
 * - Met à jour updatedAt pour remonter le contact en haut
 * - Ajoute une note indiquant que le contact a été enregistré une énième fois
 *
 * @param firstName - Prénom du contact
 * @param lastName - Nom du contact
 * @param email - Email du contact
 * @param origin - Origine du contact (pour la note)
 * @param userId - ID de l'utilisateur qui crée le contact
 * @returns L'ID du contact existant (doublon) ou null si aucun doublon
 */
export async function handleContactDuplicate(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  email: string | null | undefined,
  origin: string | null | undefined,
  userId: string,
): Promise<string | null> {
  // Normaliser les valeurs pour la comparaison
  const normalizedFirstName = firstName?.trim().toLowerCase() || null;
  const normalizedLastName = lastName?.trim().toLowerCase() || null;
  const normalizedEmail = email?.trim().toLowerCase() || null;

  // Si on n'a pas au moins nom, prénom ET email, on ne peut pas détecter de doublon
  if (!normalizedFirstName || !normalizedLastName || !normalizedEmail) {
    return null;
  }

  // Chercher un contact existant avec le même nom, prénom ET email
  const existingContact = await prisma.contact.findFirst({
    where: {
      AND: [
        { firstName: { equals: normalizedFirstName, mode: 'insensitive' } },
        { lastName: { equals: normalizedLastName, mode: 'insensitive' } },
        { email: { equals: normalizedEmail, mode: 'insensitive' } },
      ],
    },
  });

  if (!existingContact) {
    return null;
  }

  // Récupérer ou créer le statut "Doublon"
  let duplicateStatus = await prisma.status.findUnique({
    where: { name: 'Doublon' },
  });

  if (!duplicateStatus) {
    // Créer le statut Doublon s'il n'existe pas
    const lastStatus = await prisma.status.findFirst({
      orderBy: { order: 'desc' },
    });
    const newOrder = lastStatus ? lastStatus.order + 1 : 100;

    duplicateStatus = await prisma.status.create({
      data: {
        name: 'Doublon',
        color: '#EF4444', // Rouge pour indiquer un problème
        order: newOrder,
      },
    });
  }

  // Compter combien de fois ce contact a été enregistré (en comptant les notes "Contact enregistré à nouveau")
  const duplicateCount = await prisma.interaction.count({
    where: {
      contactId: existingContact.id,
      type: 'NOTE',
      title: 'Contact enregistré à nouveau',
    },
  });

  const occurrenceNumber = duplicateCount + 2; // +2 car c'est la 2ème fois minimum (1ère création + cette fois)

  // Mettre à jour le contact : changer le statut en Doublon et mettre à jour updatedAt
  await prisma.contact.update({
    where: { id: existingContact.id },
    data: {
      statusId: duplicateStatus.id,
      updatedAt: new Date(), // Pour remonter le contact en haut du tableau
    },
  });

  // Ajouter une note indiquant que le contact a été enregistré une énième fois
  await prisma.interaction.create({
    data: {
      contactId: existingContact.id,
      type: 'NOTE',
      title: 'Contact enregistré à nouveau',
      content: `Ce contact a été enregistré une ${occurrenceNumber}${occurrenceNumber === 1 ? 'ère' : 'ème'} fois${origin ? ` depuis ${origin}` : ''} le ${new Date().toLocaleDateString(
        'fr-FR',
        {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        },
      )}.`,
      userId: userId,
      date: new Date(),
    },
  });

  return existingContact.id;
}
