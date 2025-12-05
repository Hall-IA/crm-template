import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { handleContactDuplicate } from '@/lib/contact-duplicate';

// POST /api/contacts/import - Importer des contacts depuis un fichier CSV/Excel
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const mappingJson = formData.get('mapping') as string;
    const skipFirstRow = formData.get('skipFirstRow') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    if (!mappingJson) {
      return NextResponse.json({ error: 'Mapping des colonnes requis' }, { status: 400 });
    }

    const mapping = JSON.parse(mappingJson);

    // Parser le fichier selon son type
    let rows: any[] = [];
    const fileName = file.name.toLowerCase();
    const fileExtension = fileName.split('.').pop();

    if (fileExtension === 'csv') {
      // Parser CSV
      const text = await file.text();
      rows = parseCSV(text);
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      // Parser Excel
      try {
        const XLSX = require('xlsx');
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        rows = XLSX.utils.sheet_to_json(worksheet, { raw: false });
      } catch (error) {
        return NextResponse.json(
          { error: 'Erreur lors du parsing Excel. Assurez-vous que xlsx est installé.' },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Format de fichier non supporté. Utilisez CSV ou Excel (.xlsx, .xls)' },
        { status: 400 }
      );
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Le fichier est vide' }, { status: 400 });
    }

    // Ignorer la première ligne si c'est un en-tête
    const dataRows = skipFirstRow ? rows.slice(1) : rows;

    // Récupérer le statut "Nouveau" par défaut
    const defaultStatus = await prisma.status.findUnique({
      where: { name: 'Nouveau' },
    });

    // Valider et mapper les données
    const contactsToCreate: any[] = [];
    const errors: string[] = [];
    const skipped: number[] = [];

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowNumber = skipFirstRow ? i + 2 : i + 1;

      try {
        // Mapper les colonnes selon le mapping fourni
        const phone = getValueFromRow(row, mapping.phone);
        if (!phone) {
          skipped.push(rowNumber);
          continue; // Le téléphone est obligatoire
        }

        // Normaliser le numéro de téléphone (supprimer espaces, tirets, etc.)
        const normalizedPhone = phone.toString().replace(/[\s\-\.\(\)]/g, '');

        // Déterminer le statusId : utiliser le mapping si fourni, sinon le statut par défaut "Nouveau"
        let statusId = null;
        if (mapping.statusId) {
          const mappedStatus = getValueFromRow(row, mapping.statusId);
          if (mappedStatus) {
            // Si une valeur est mappée, chercher le statut par nom
            const status = await prisma.status.findUnique({
              where: { name: mappedStatus },
            });
            statusId = status?.id || null;
          }
        }
        // Si aucun statut n'a été trouvé via le mapping, utiliser le statut par défaut "Nouveau"
        if (!statusId && defaultStatus) {
          statusId = defaultStatus.id;
        }

        const contactData: any = {
          phone: normalizedPhone,
          civility: getValueFromRow(row, mapping.civility) || null,
          firstName: getValueFromRow(row, mapping.firstName) || null,
          lastName: getValueFromRow(row, mapping.lastName) || null,
          secondaryPhone: getValueFromRow(row, mapping.secondaryPhone) || null,
          email: getValueFromRow(row, mapping.email) || null,
          address: getValueFromRow(row, mapping.address) || null,
          city: getValueFromRow(row, mapping.city) || null,
          postalCode: getValueFromRow(row, mapping.postalCode) || null,
          origin: getValueFromRow(row, mapping.origin) || null,
          statusId: statusId,
          assignedCommercialId: mapping.assignedCommercialId
            ? getValueFromRow(row, mapping.assignedCommercialId) || null
            : null,
          assignedTeleproId: mapping.assignedTeleproId
            ? getValueFromRow(row, mapping.assignedTeleproId) || null
            : null,
          createdById: session.user.id,
        };

        // Valider les données
        if (!contactData.phone || contactData.phone.trim() === '') {
          skipped.push(rowNumber);
          continue;
        }

        contactsToCreate.push(contactData);
      } catch (error: any) {
        errors.push(`Ligne ${rowNumber}: ${error.message}`);
      }
    }

    // Créer les contacts en lot
    const createdContacts = [];
    const duplicateErrors = [];

    for (const contactData of contactsToCreate) {
      try {
        // Vérifier si c'est un doublon (nom, prénom ET email)
        const duplicateContactId = await handleContactDuplicate(
          contactData.firstName,
          contactData.lastName,
          contactData.email,
          contactData.origin || 'Import CSV/Excel',
          session.user.id
        );

        if (duplicateContactId) {
          // C'est un doublon, récupérer le contact existant
          const existingContact = await prisma.contact.findUnique({
            where: { id: duplicateContactId },
            include: {
              status: true,
              assignedCommercial: {
                select: { id: true, name: true, email: true },
              },
              assignedTelepro: {
                select: { id: true, name: true, email: true },
              },
              createdBy: {
                select: { id: true, name: true, email: true },
              },
            },
          });
          if (existingContact) {
            createdContacts.push(existingContact);
            duplicateErrors.push(`Contact ${contactData.firstName} ${contactData.lastName} (${contactData.email}) - doublon détecté`);
          }
          continue;
        }

        // Vérifier aussi par téléphone pour éviter les doublons par téléphone uniquement
        const existingByPhone = await prisma.contact.findFirst({
          where: { phone: contactData.phone },
        });

        if (existingByPhone) {
          duplicateErrors.push(`Téléphone ${contactData.phone} déjà existant`);
          continue;
        }

        const contact = await prisma.contact.create({
          data: {
            ...contactData,
            interactions: {
              create: {
                type: 'NOTE',
                title: 'Contact importé',
                content: `Contact importé depuis un fichier le ${new Date().toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}`,
                userId: session.user.id,
                date: new Date(),
              },
            },
          },
          include: {
            status: true,
            assignedCommercial: {
              select: { id: true, name: true, email: true },
            },
            assignedTelepro: {
              select: { id: true, name: true, email: true },
            },
            createdBy: {
              select: { id: true, name: true, email: true },
            },
          },
        });

        createdContacts.push(contact);
      } catch (error: any) {
        errors.push(`Erreur lors de la création: ${error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      imported: createdContacts.length,
      skipped: skipped.length,
      duplicates: duplicateErrors.length,
      errors: errors.length,
      details: {
        created: createdContacts.length,
        skippedRows: skipped,
        duplicatePhones: duplicateErrors,
        errors: errors.slice(0, 10), // Limiter à 10 erreurs
      },
    });
  } catch (error: any) {
    console.error('Erreur lors de l\'import:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur lors de l\'import' },
      { status: 500 }
    );
  }
}

// Fonction pour parser CSV
function parseCSV(text: string): any[] {
  const lines = text.split('\n').filter((line) => line.trim() !== '');
  if (lines.length === 0) return [];

  // Détecter le délimiteur (virgule ou point-virgule)
  const firstLine = lines[0];
  const delimiter = firstLine.includes(';') ? ';' : ',';

  // Parser les en-têtes
  const headers = lines[0].split(delimiter).map((h) => h.trim().replace(/^"|"$/g, ''));

  // Parser les lignes de données
  const rows: any[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(delimiter).map((v) => v.trim().replace(/^"|"$/g, ''));
    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    rows.push(row);
  }

  return rows;
}

// Fonction pour extraire une valeur d'une ligne selon le mapping
function getValueFromRow(row: any, columnName: string | null | undefined): string | null {
  if (!columnName || columnName === '') return null;

  // Essayer différentes variantes du nom de colonne
  const variants = [
    columnName,
    columnName.toLowerCase(),
    columnName.toUpperCase(),
    columnName.trim(),
  ];

  for (const variant of variants) {
    if (row[variant] !== undefined && row[variant] !== null && row[variant] !== '') {
      return String(row[variant]).trim();
    }
  }

  return null;
}

