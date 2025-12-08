/**
 * Système de variables pour les templates
 * Les variables sont au format {{variableName}}
 */

export interface ContactVariables {
  firstName?: string | null;
  lastName?: string | null;
  civility?: string | null;
  email?: string | null;
  phone?: string | null;
  secondaryPhone?: string | null;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  companyName?: string | null;
}

/**
 * Liste des variables disponibles avec leurs descriptions
 */
export const AVAILABLE_VARIABLES = [
  { key: '{{firstName}}', description: 'Prénom du contact' },
  { key: '{{lastName}}', description: 'Nom du contact' },
  { key: '{{fullName}}', description: 'Prénom et nom complets' },
  { key: '{{civility}}', description: 'Civilité (M., Mme, Mlle)' },
  { key: '{{email}}', description: 'Email du contact' },
  { key: '{{phone}}', description: 'Téléphone principal' },
  { key: '{{secondaryPhone}}', description: 'Téléphone secondaire' },
  { key: '{{address}}', description: 'Adresse complète' },
  { key: '{{city}}', description: 'Ville' },
  { key: '{{postalCode}}', description: 'Code postal' },
  { key: '{{companyName}}', description: 'Nom de l\'entreprise associée' },
];

/**
 * Remplace les variables dans un template par les valeurs du contact
 */
export function replaceTemplateVariables(
  template: string,
  variables: ContactVariables
): string {
  let result = template;

  // Remplacer les variables simples
  result = result.replace(/\{\{firstName\}\}/g, variables.firstName || '');
  result = result.replace(/\{\{lastName\}\}/g, variables.lastName || '');
  result = result.replace(/\{\{civility\}\}/g, variables.civility || '');
  result = result.replace(/\{\{email\}\}/g, variables.email || '');
  result = result.replace(/\{\{phone\}\}/g, variables.phone || '');
  result = result.replace(/\{\{secondaryPhone\}\}/g, variables.secondaryPhone || '');
  result = result.replace(/\{\{address\}\}/g, variables.address || '');
  result = result.replace(/\{\{city\}\}/g, variables.city || '');
  result = result.replace(/\{\{postalCode\}\}/g, variables.postalCode || '');
  result = result.replace(/\{\{companyName\}\}/g, variables.companyName || '');

  // Variable composée : fullName
  const fullName = [variables.firstName, variables.lastName]
    .filter(Boolean)
    .join(' ') || '';
  result = result.replace(/\{\{fullName\}\}/g, fullName);

  return result;
}

/**
 * Extrait toutes les variables utilisées dans un template
 */
export function extractVariables(template: string): string[] {
  const regex = /\{\{(\w+)\}\}/g;
  const variables: string[] = [];
  let match;

  while ((match = regex.exec(template)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }

  return variables;
}

