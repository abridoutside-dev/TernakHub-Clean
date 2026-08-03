// ─── AES-256-GCM Credential Encryption — ADMIN-PLATFORM-003B ─────────────────
//
// Encrypts/decrypts sensitive credential strings using AES-256-GCM.
// Key is derived from SESSION_SECRET via SHA-256 (32 bytes).
//
// Ciphertext format: <iv_hex>:<authTag_hex>:<encrypted_hex>
//
// SECURITY:
//   - Never log plaintext credentials.
//   - Never return plaintext credentials to the browser.
//   - Return CREDENTIAL_MASKED sentinel to the browser instead.
//   - Only decrypt server-side when needed for API calls.
// ─────────────────────────────────────────────────────────────────────────────

import crypto from 'node:crypto';

/** Sentinel returned to the browser in place of a stored credential. */
export const CREDENTIAL_MASKED = '**masked**';

/** Returns true if a value from the browser is a masked sentinel (not a new value). */
export function isCredentialMasked(value: string): boolean {
  return value === CREDENTIAL_MASKED || value === '' || value.startsWith('**');
}

function deriveKey(): Buffer {
  const secret = process.env.SESSION_SECRET ?? '';
  if (!secret) throw new Error('SESSION_SECRET is not set — cannot encrypt/decrypt credentials');
  return crypto.createHash('sha256').update(secret, 'utf8').digest();
}

/**
 * Encrypt a plaintext string.
 * Returns a string in the format: <iv_hex>:<authTag_hex>:<ciphertext_hex>
 */
export function encryptCredential(plaintext: string): string {
  if (!plaintext) return '';
  const key = deriveKey();
  const iv  = crypto.randomBytes(12); // 96-bit IV recommended for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypt a ciphertext string produced by encryptCredential().
 * Returns the original plaintext.
 * Throws if the format is invalid or authentication fails.
 */
export function decryptCredential(ciphertext: string): string {
  if (!ciphertext) return '';
  const parts = ciphertext.split(':');
  if (parts.length !== 3) throw new Error('Invalid encrypted credential format');
  const [ivHex, authTagHex, encryptedHex] = parts;
  const key       = deriveKey();
  const iv        = Buffer.from(ivHex, 'hex');
  const authTag   = Buffer.from(authTagHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const decipher  = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(encrypted).toString('utf8') + decipher.final('utf8');
}
