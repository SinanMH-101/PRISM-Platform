import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scrypt = promisify(scryptCallback);
const keyLength = 64;

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, keyLength)) as Buffer;
  return `scrypt:${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, passwordHash: string) {
  const [scheme, salt, storedHash] = passwordHash.split(":");
  if (scheme !== "scrypt" || !salt || !storedHash) return false;

  const storedBuffer = Buffer.from(storedHash, "hex");
  const derivedKey = (await scrypt(password, salt, storedBuffer.length)) as Buffer;

  return storedBuffer.length === derivedKey.length && timingSafeEqual(storedBuffer, derivedKey);
}
