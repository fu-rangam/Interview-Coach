import CryptoJS from 'crypto-js';

const SECRET_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'default-secret'; // Using Supabase Anon Key as a simpler secret for client-side obfuscation. 
// Ideally, for true security, this should be a user-derived key, but for this level of hardening (preventing casual local storage snooping), this suffices.

export const encrypt = (data: any) => CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString();

export const decrypt = (ciphertext: string) => {
    try {
        const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
        return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    } catch { return null; }
};
