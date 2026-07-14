import crypto from "crypto";

export class EncryptionService {
  private static ALGORITHM = "aes-256-gcm";
  
  // Local key representation. In production this resolves to a KMS HSM key reference
  private static ENCRYPTION_KEY = crypto.scryptSync(
    process.env.ENCRYPTION_SECRET || "omni_default_post_quantum_secure_secret_key_2026",
    "salt",
    32
  );

  /**
   * AES-256-GCM Encryption for sensitive credentials (ParentVUE passwords, SSO tokens).
   */
  public static encrypt(text: string): { iv: string; encryptedData: string; tag: string } {
    const iv = crypto.randomBytes(12); // GCM standard IV length is 12 bytes
    const cipher = crypto.createCipheriv(this.ALGORITHM, this.ENCRYPTION_KEY, iv) as crypto.CipherGCM;
    
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    
    const tag = cipher.getAuthTag().toString("hex");

    return {
      iv: iv.toString("hex"),
      encryptedData: encrypted,
      tag: tag,
    };
  }

  public static decrypt(encryptedData: string, ivHex: string, tagHex: string): string {
    const iv = Buffer.from(ivHex, "hex");
    const tag = Buffer.from(tagHex, "hex");
    
    const decipher = crypto.createDecipheriv(this.ALGORITHM, this.ENCRYPTION_KEY, iv) as crypto.DecipherGCM;
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  }
}
