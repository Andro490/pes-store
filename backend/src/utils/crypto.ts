import crypto from 'crypto';

// Key must be 32 bytes for AES-256-GCM
function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'pes_store_secure_encryption_key_32bytes!';
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypt plaintext using AES-256-GCM authenticated encryption.
 * Output format: enc:<iv-hex>:<tag-hex>:<ciphertext-hex>
 */
export function encryptData(plaintext: string): string {
  if (!plaintext || typeof plaintext !== 'string') return plaintext;

  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(12); // 96-bit IV recommended for GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');
    return `enc:${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (error) {
    console.error('Encryption failed:', error);
    return plaintext;
  }
}

/**
 * Decrypt ciphertext using AES-256-GCM.
 * Seamlessly supports legacy plaintext strings if they are not prefixed with "enc:".
 */
export function decryptData(cipherData: string): string {
  if (!cipherData || typeof cipherData !== 'string') return cipherData;

  // If not encrypted with our prefix, return as-is (legacy backwards compatibility)
  if (!cipherData.startsWith('enc:')) {
    return cipherData;
  }

  try {
    const parts = cipherData.split(':');
    if (parts.length !== 4) return cipherData;

    const iv = Buffer.from(parts[1], 'hex');
    const authTag = Buffer.from(parts[2], 'hex');
    const ciphertext = parts[3];

    const key = getEncryptionKey();
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption failed or corrupted ciphertext');
    return '[Decryption Error]';
  }
}

/**
 * Mask sensitive credentials for display in lists
 */
export function maskSensitive(val: string): string {
  if (!val) return '••••••';
  if (val.length <= 4) return '••••••';
  return val.slice(0, 2) + '••••••' + val.slice(-2);
}
