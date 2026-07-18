import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 10000;

function getSecretKey() {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || "fallback-temporary-secret-key-12345678";
  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptPayload(payload: any): string {
  const secretKey = getSecretKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = crypto.randomBytes(SALT_LENGTH);
  
  const derivedKey = crypto.pbkdf2Sync(secretKey, salt, ITERATIONS, KEY_LENGTH, "sha256");
  
  const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(payload), "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  
  return [
    salt.toString("hex"),
    iv.toString("hex"),
    authTag.toString("hex"),
    encrypted.toString("hex")
  ].join(":");
}

export function decryptPayload(token: string): any {
  try {
    const parts = token.split(":");
    if (parts.length !== 4) {
      throw new Error("Invalid token format");
    }
    
    const [saltHex, ivHex, authTagHex, encryptedHex] = parts;
    
    const secretKey = getSecretKey();
    const salt = Buffer.from(saltHex, "hex");
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const encrypted = Buffer.from(encryptedHex, "hex");
    
    const derivedKey = crypto.pbkdf2Sync(secretKey, salt, ITERATIONS, KEY_LENGTH, "sha256");
    
    const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv);
    decipher.setAuthTag(authTag);
    
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return JSON.parse(decrypted.toString("utf8"));
  } catch (error) {
    console.error("Failed to decrypt token:", error);
    return null;
  }
}
