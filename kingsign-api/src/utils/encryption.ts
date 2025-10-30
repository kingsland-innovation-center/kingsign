import crypto from 'crypto';

/**
 * Encryption utility for API keys using AES-256-GCM
 * Uses ENCRYPTION_SECRET from environment variables
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // For GCM, this is 12 bytes
const TAG_LENGTH = 16; // GCM tag length
const KEY_LENGTH = 32; // 256 bits

/**
 * Get the encryption secret from environment variables
 * @throws Error if ENCRYPTION_SECRET is not set
 */
function getEncryptionSecret(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET;
  if (!secret) {
    throw new Error('ENCRYPTION_SECRET environment variable is required for API key encryption');
  }
  
  // Derive a 32-byte key from the secret using SHA-256
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypt an API key
 * @param apiKey - The API key to encrypt
 * @returns Encrypted string in format: iv:tag:encryptedData (base64 encoded)
 */
export function encryptApiKey(apiKey: string): string {
  try {
    const key = getEncryptionSecret();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    cipher.setAAD(Buffer.from('api-key', 'utf8')); // Additional authenticated data
    
    let encrypted = cipher.update(apiKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    // Combine IV, tag, and encrypted data
    const combined = Buffer.concat([iv, tag, Buffer.from(encrypted, 'hex')]);
    
    return combined.toString('base64');
  } catch (error) {
    throw new Error(`Failed to encrypt API key: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decrypt an API key
 * @param encryptedApiKey - The encrypted API key string
 * @returns Decrypted API key
 */
export function decryptApiKey(encryptedApiKey: string): string {
  try {
    const key = getEncryptionSecret();
    const combined = Buffer.from(encryptedApiKey, 'base64');
    
    // Extract IV, tag, and encrypted data
    const iv = combined.subarray(0, IV_LENGTH);
    const tag = combined.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const encrypted = combined.subarray(IV_LENGTH + TAG_LENGTH);
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    decipher.setAAD(Buffer.from('api-key', 'utf8')); // Must match encryption AAD
    
    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error(`Failed to decrypt API key: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if a string is encrypted (basic validation)
 * @param value - The string to check
 * @returns True if the string appears to be encrypted
 */
export function isEncrypted(value: string): boolean {
  try {
    // Try to decode as base64 and check if it has the expected structure
    const decoded = Buffer.from(value, 'base64');
    return decoded.length >= IV_LENGTH + TAG_LENGTH + 1; // At least IV + tag + some encrypted data
  } catch {
    return false;
  }
}

/**
 * Safely encrypt an API key only if it's not already encrypted
 * @param apiKey - The API key to encrypt
 * @returns Encrypted API key (or original if already encrypted)
 */
export function safeEncryptApiKey(apiKey: string): string {
  if (isEncrypted(apiKey)) {
    return apiKey; // Already encrypted
  }
  return encryptApiKey(apiKey);
}

/**
 * Safely decrypt an API key only if it's encrypted
 * @param apiKey - The API key to decrypt
 * @returns Decrypted API key (or original if not encrypted)
 */
export function safeDecryptApiKey(apiKey: string): string {
  if (!isEncrypted(apiKey)) {
    return apiKey; // Not encrypted
  }
  return decryptApiKey(apiKey);
} 