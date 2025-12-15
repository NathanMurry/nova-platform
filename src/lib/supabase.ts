import { createClient } from '@supabase/supabase-js';

// Diese Werte musst du aus deinem Supabase-Dashboard holen:
// 1. Gehe zu supabase.com → Dein Projekt → Settings → API
// 2. Kopiere "Project URL" und "anon public" Key

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Supabase nicht konfiguriert. Füge VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY zu deiner .env Datei hinzu.');
}

// Erstelle den Supabase Client ohne strenge Typprüfung
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
