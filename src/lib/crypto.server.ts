/**
 * Server-only token encryption.
 *
 * Platform access/refresh tokens are encrypted with AES-256-GCM before they
 * are written to `social_connection_secrets`, using SOCIAL_TOKEN_ENCRYPTION_KEY.
 * Plaintext tokens never leave this module, are never logged and are never
 * returned to any client.
 */

const encoder = new TextEncoder();
const decoder = new TextDecoder();

async function keyMaterial(): Promise<CryptoKey> {
  const secret = process.env.SOCIAL_TOKEN_ENCRYPTION_KEY;
  if (!secret) throw new Error("SOCIAL_TOKEN_ENCRYPTION_KEY is not configured.");
  // Derive a stable 256-bit key from the configured secret.
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(secret));
  return crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function encryptSecret(plaintext: string): Promise<string> {
  const key = await keyMaterial();
  const iv = crypto.getRandomValues(new Uint8Array(new ArrayBuffer(12)));
  const cipher = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoder.encode(plaintext)),
  );
  return `v1.${toBase64(iv)}.${toBase64(cipher)}`;
}

export async function decryptSecret(payload: string | null): Promise<string | null> {
  if (!payload) return null;
  const [version, ivPart, cipherPart] = payload.split(".");
  if (version !== "v1" || !ivPart || !cipherPart) return null;
  try {
    const key = await keyMaterial();
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromBase64(ivPart) },
      key,
      fromBase64(cipherPart),
    );
    return decoder.decode(plain);
  } catch {
    // Never surface cipher details.
    return null;
  }
}

export function tokenEncryptionConfigured(): boolean {
  return Boolean(process.env.SOCIAL_TOKEN_ENCRYPTION_KEY);
}
