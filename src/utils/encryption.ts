import CryptoJS from 'crypto-js';

// Legacy key for migration support
const LEGACY_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'default-secret';
const LOCAL_KEY_STORAGE = 'local_encryption_key';

/**
 * Retrieves or generates a unique encryption key for this client.
 * This ensures we don't use a shared public key for client-side encryption.
 */
export const getStorageKey = (): string => {
    let key = localStorage.getItem(LOCAL_KEY_STORAGE);
    if (!key) {
        // Generate a strong random key
        // Prefer crypto.randomUUID if available, else fallback to CryptoJS random
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            key = crypto.randomUUID();
        } else {
            key = CryptoJS.lib.WordArray.random(32).toString();
        }
        localStorage.setItem(LOCAL_KEY_STORAGE, key);
    }
    return key;
};

export const encrypt = (data: any): string => {
    const key = getStorageKey();
    return CryptoJS.AES.encrypt(JSON.stringify(data), key).toString();
};

export const decrypt = (ciphertext: string): any => {
    try {
        // 1. Try decrypting with the current local secure key
        const key = getStorageKey();
        const bytes = CryptoJS.AES.decrypt(ciphertext, key);
        const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);

        if (decryptedStr) {
            return JSON.parse(decryptedStr);
        }
    } catch {
        // Continue to fallback
    }

    // 2. Fallback: Try decrypting with the legacy public key (Migration path)
    try {
        const bytes = CryptoJS.AES.decrypt(ciphertext, LEGACY_KEY);
        const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);

        if (decryptedStr) {
            return JSON.parse(decryptedStr);
        }
    } catch {
        // Continue to fallback
    }

    // 3. Fallback: Check if it's just plain JSON (unencrypted legacy or failure)
    try {
        return JSON.parse(ciphertext);
    } catch {
        return null;
    }
};

/**
 * Secure storage wrapper that handles object serialization and encryption/decryption transparently.
 */
export const secureStorage = {
    getItem: <T>(key: string): T | null => {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        return decrypt(raw);
    },
    setItem: (key: string, value: any) => {
        const ciphertext = encrypt(value);
        localStorage.setItem(key, ciphertext);
    },
    removeItem: (key: string) => localStorage.removeItem(key)
};

