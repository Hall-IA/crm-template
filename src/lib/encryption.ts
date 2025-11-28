import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits

// Récupérer la clé depuis les variables d'environnement
function getEncryptionKey(): Buffer | null {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    console.warn('⚠️  ENCRYPTION_KEY n\'est pas définie. Le chiffrement ne sera pas utilisé.');
    return null;
  }
  
  // Si la clé est en hexadécimal, la convertir
  if (key.length === 64) {
    return Buffer.from(key, 'hex');
  }
  
  // Sinon, utiliser directement (mais ce n'est pas recommandé)
  // On génère un hash pour avoir exactement 32 bytes
  return crypto.createHash('sha256').update(key).digest();
}

/**
 * Chiffre un texte avec AES-256-GCM
 * @param text - Le texte à chiffrer
 * @returns Le texte chiffré au format: iv:tag:encrypted (ou texte en clair si ENCRYPTION_KEY n'est pas définie)
 */
export function encrypt(text: string): string {
  if (!text) {
    return text;
  }
  
  const key = getEncryptionKey();
  
  // Si la clé n'est pas définie, retourner le texte en clair (avec un avertissement)
  if (!key) {
    console.warn('⚠️  Chiffrement désactivé : ENCRYPTION_KEY non définie. Le mot de passe sera stocké en clair.');
    return text;
  }
  
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  
  // Retourner: iv:tag:encrypted
  return iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;
}

/**
 * Déchiffre un texte chiffré avec AES-256-GCM
 * @param encryptedData - Le texte chiffré au format: iv:tag:encrypted
 * @returns Le texte déchiffré
 */
export function decrypt(encryptedData: string): string {
  if (!encryptedData) {
    return encryptedData;
  }
  
  // Si le format ne correspond pas (ancien format non chiffré), retourner tel quel
  const parts = encryptedData.split(':');
  if (parts.length !== 3) {
    // Probablement un ancien mot de passe non chiffré, retourner tel quel
    // (pour la migration des données existantes)
    return encryptedData;
  }
  
  try {
    const key = getEncryptionKey();
    
    // Si la clé n'est pas définie et que le texte est chiffré, on ne peut pas le déchiffrer
    if (!key) {
      console.warn('⚠️  Impossible de déchiffrer : ENCRYPTION_KEY non définie.');
      return encryptedData;
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const tag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    // Si le déchiffrement échoue, retourner tel quel (pour la compatibilité)
    console.error('Erreur lors du déchiffrement:', error);
    return encryptedData;
  }
}

