/**
 * Shared password hashing and verification using PBKDF2 with per-user salt.
 *
 * Replaces raw SHA-256 (no salt, no stretching) that was previously
 * copy-pasted across register.ts, login.ts, profile/index.ts, and admin/users.ts.
 *
 * Uses Web Crypto API (available in Cloudflare Workers) with:
 *   - PBKDF2 key derivation
 *   - Random 16-byte salt per password
 *   - 100 000 iterations of SHA-256
 *   - 32-byte derived key
 *
 * Storage format: "<hex-salt>:<hex-derived-key>"
 */

import { Effect } from 'effect';

const PBKDF2_ITERATIONS = 100_000;
const SALT_BYTE_LENGTH = 16;
const KEY_BYTE_LENGTH = 32;
const ALGORITHM = 'SHA-256';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

async function deriveKey(password: string, salt: Uint8Array): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: ALGORITHM,
    },
    keyMaterial,
    KEY_BYTE_LENGTH * 8 // length in bits
  );

  return new Uint8Array(derivedBits);
}

// ---------------------------------------------------------------------------
// Public API (Effect-wrapped for consistency with codebase)
// ---------------------------------------------------------------------------

/**
 * Hash a plaintext password, returning "salt:hash" for storage.
 */
export const hashPassword = (password: string): Effect.Effect<string, never, never> =>
  Effect.promise(async () => {
    const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTE_LENGTH));
    const derived = await deriveKey(password, salt);
    return `${bytesToHex(salt)}:${bytesToHex(derived)}`;
  });

/**
 * Verify a plaintext password against a stored "salt:hash" string.
 *
 * Also accepts legacy unsalted SHA-256 hashes (64-char hex with no colon)
 * so existing users can still log in. After successful verification of a
 * legacy hash the caller should re-hash and store the new format.
 */
export const verifyPassword = (
  password: string,
  storedHash: string
): Effect.Effect<{ valid: boolean; isLegacyHash: boolean }, never, never> =>
  Effect.promise(async () => {
    const isLegacy = !storedHash.includes(':');

    if (isLegacy) {
      // Legacy SHA-256 comparison (no salt)
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const computedHash = bytesToHex(new Uint8Array(hashBuffer));
      return { valid: computedHash === storedHash, isLegacyHash: true };
    }

    const [saltHex, hashHex] = storedHash.split(':');
    const salt = hexToBytes(saltHex);
    const derived = await deriveKey(password, salt);
    const computedHex = bytesToHex(derived);
    return { valid: computedHex === hashHex, isLegacyHash: false };
  });
