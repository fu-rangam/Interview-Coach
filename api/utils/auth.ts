import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase Environment Variables in API");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function validateUser(req) {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        throw new Error("Unauthorized: Missing Authorization Header");
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        throw new Error("Unauthorized: Invalid Bearer Token");
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
        throw new Error("Unauthorized: Invalid or Expired Token");
    }

    return user;
}
