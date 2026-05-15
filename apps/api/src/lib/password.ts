const ITER = 100000;
const KEY_LEN = 32;

function enc(s: string) {
  return new TextEncoder().encode(s);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(password, salt, ITER);
  return `${ITER}$${bufToHex(salt)}$${bufToHex(key)}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 3) return false;
  const iter = Number(parts[0]);
  const salt = hexToBuf(parts[1]);
  const want = hexToBuf(parts[2]);
  if (!Number.isFinite(iter) || iter < 10000 || salt.length < 8 || want.length < 16) {
    return false;
  }
  const key = await deriveKey(password, salt, iter);
  if (key.length !== want.length) return false;
  let ok = 0;
  for (let i = 0; i < key.length; i++) ok |= key[i] ^ want[i];
  return ok === 0;
}

async function deriveKey(
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<Uint8Array> {
  const pass = await crypto.subtle.importKey(
    "raw",
    enc(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    pass,
    KEY_LEN * 8,
  );
  return new Uint8Array(bits);
}

function bufToHex(b: Uint8Array): string {
  return [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

function hexToBuf(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}
