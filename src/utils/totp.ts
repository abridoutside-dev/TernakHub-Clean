// ─── TOTP — Time-based One-Time Password (RFC 6238) ──────────────────────────
// Pure client-side implementation using the Web Crypto API (HMAC-SHA1).
// No external dependencies.
//
// Compatible with Google Authenticator, Authy, Microsoft Authenticator, and
// any RFC 6238-compliant authenticator app.
//
// API:
//   generateBase32Secret()      → random 160-bit base32 secret
//   verifyTOTP(secret, code)    → Promise<boolean>  (window ±1 period)
//   getTOTPUri(label, secret)   → otpauth:// URI
//   getTOTPQRUrl(label, secret) → QR code image URL (via Google Charts API)
//   formatSecretDisplay(secret) → groups of 4 chars for easy manual entry

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

// ─── Secret generation ────────────────────────────────────────────────────────

/** Generate a cryptographically random 160-bit base32 secret (20 bytes). */
export function generateBase32Secret(byteCount = 20): string {
  const bytes = crypto.getRandomValues(new Uint8Array(byteCount));
  let result = '';
  let bits = 0;
  let value = 0;
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      result += BASE32_ALPHABET[(value >>> (bits - 5)) & 0x1f];
      bits -= 5;
    }
  }
  if (bits > 0) result += BASE32_ALPHABET[(value << (5 - bits)) & 0x1f];
  return result;
}

/** Format a base32 secret as groups of 4 for display (e.g. "JBSW Y3DP"). */
export function formatSecretDisplay(secret: string): string {
  return secret.match(/.{1,4}/g)?.join(' ') ?? secret;
}

// ─── Base32 decode ────────────────────────────────────────────────────────────

function base32Decode(secret: string): Uint8Array {
  const s = secret.toUpperCase().replace(/\s+/g, '').replace(/=+$/, '');
  const bytes: number[] = [];
  let bits = 0;
  let value = 0;
  for (const char of s) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx === -1) throw new Error(`Invalid base32 character: ${char}`);
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return new Uint8Array(bytes);
}

// ─── HOTP core (RFC 4226) ─────────────────────────────────────────────────────

async function hotp(secretBytes: Uint8Array, counter: number): Promise<number> {
  const key = await crypto.subtle.importKey(
    'raw',
    secretBytes.buffer.slice(secretBytes.byteOffset, secretBytes.byteOffset + secretBytes.byteLength) as ArrayBuffer,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  );

  // Counter as 8-byte big-endian unsigned integer
  const buf = new ArrayBuffer(8);
  const view = new DataView(buf);
  // JavaScript numbers are safe up to 2^53 — counter values for TOTP are tiny
  view.setUint32(0, Math.floor(counter / 0x100000000), false);
  view.setUint32(4, counter >>> 0, false);

  const hmac = new Uint8Array(await crypto.subtle.sign('HMAC', key, buf));

  // Dynamic truncation
  const offset = hmac[19] & 0x0f;
  const code =
    (((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff)) %
    1_000_000;

  return code;
}

// ─── TOTP verify ─────────────────────────────────────────────────────────────

/**
 * Verify a 6-digit TOTP code against a base32 secret.
 * Accepts a time window of ±1 period (±30 s) to allow for clock skew.
 */
export async function verifyTOTP(
  secret: string,
  code: string,
  windowSize = 1,
): Promise<boolean> {
  const trimmed = code.replace(/\s/g, '');
  if (!/^\d{6}$/.test(trimmed)) return false;

  let secretBytes: Uint8Array;
  try {
    secretBytes = base32Decode(secret);
  } catch {
    return false;
  }

  const codeNum = parseInt(trimmed, 10);
  const timeStep = Math.floor(Date.now() / 30_000);

  for (let i = -windowSize; i <= windowSize; i++) {
    const expected = await hotp(secretBytes, timeStep + i);
    if (expected === codeNum) return true;
  }
  return false;
}

// ─── URI helpers ──────────────────────────────────────────────────────────────

/**
 * Build an otpauth:// URI compatible with all major authenticator apps.
 * @param label  Shown in the authenticator app (e.g. "user@example.com")
 * @param secret Base32-encoded TOTP secret
 * @param issuer App / service name (shown in the authenticator app)
 */
export function getTOTPUri(
  label: string,
  secret: string,
  issuer = 'TernakHub',
): string {
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: 'SHA1',
    digits: '6',
    period: '30',
  });
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(label)}?${params}`;
}

/**
 * Return a QR-code image URL for the TOTP secret using the Google Charts API.
 * Scan with Google Authenticator, Authy, or any RFC 6238 app.
 */
export function getTOTPQRUrl(label: string, secret: string, issuer = 'TernakHub'): string {
  const uri = getTOTPUri(label, secret, issuer);
  return (
    'https://chart.googleapis.com/chart' +
    `?chs=220x220&chld=M|0&cht=qr&chl=${encodeURIComponent(uri)}`
  );
}
