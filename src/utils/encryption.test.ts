
import { describe, it, expect, beforeEach, vi } from 'vitest';
import CryptoJS from 'crypto-js';

// We need to mock the module storage or rely on JSDOM's localStorage
// Since we are testing the module which interacts with localStorage, we'll rely on JSDOM.

describe('Encryption Utils', () => {

    // The "old" key logic from the original file
    const LEGACY_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'default-secret';

    beforeEach(() => {
        localStorage.clear();
        vi.resetModules();
    });

    it('should generate a local encryption key if none exists', async () => {
        // Dynamic import to re-evaluate the module's top-level code if necessary, 
        // or just rely on the function call to trigger key generation if we implement it that way.
        // For this test to work with static imports, we'll assume we interact with the exported functions.
        const { getStorageKey } = await import('./encryption');

        const key = getStorageKey();
        expect(key).toBeDefined();
        expect(localStorage.getItem('local_encryption_key')).toBe(key);
    });

    it('should persist the key across calls', async () => {
        const { getStorageKey } = await import('./encryption');
        const key1 = getStorageKey();
        const key2 = getStorageKey();
        expect(key1).toBe(key2);
    });

    it('should encrypt and decrypt data correctly', async () => {
        const { encrypt, decrypt } = await import('./encryption');
        const data = { foo: 'bar', baz: 123 };

        const ciphertext = encrypt(data);
        expect(ciphertext).not.toBe(JSON.stringify(data));

        const decrypted = decrypt(ciphertext);
        expect(decrypted).toEqual(data);
    });

    it('should decrypt legacy data encrypted with the public Supabase key', async () => {
        const { decrypt, getStorageKey } = await import('./encryption');

        // Ensure we have a NEW key generated
        const newKey = getStorageKey();
        expect(newKey).not.toBe(LEGACY_KEY); // Chances are astronomical, but good to check

        // Manually encrypt data with the LEGACY key
        const data = { legacy: 'data' };
        const legacyCiphertext = CryptoJS.AES.encrypt(JSON.stringify(data), LEGACY_KEY).toString();

        // Decrypt using the utility
        const result = decrypt(legacyCiphertext);

        expect(result).toEqual(data);
    });

    it('should return null for invalid ciphertext', async () => {
        const { decrypt } = await import('./encryption');
        expect(decrypt('invalid-garbage')).toBeNull();
    });
});
