import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Diese Werte musst du aus deinem Supabase-Dashboard holen:
// 1. Gehe zu supabase.com → Dein Projekt → Settings → API
// 2. Kopiere "Project URL" und "anon public" Key

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Supabase nicht konfiguriert. Füge VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY zu deiner .env Datei hinzu.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Helper-Funktionen für häufige Operationen
export const db = {
    // === UNTERNEHMER ===
    entrepreneurs: {
        create: async (data: Database['public']['Tables']['entrepreneurs']['Insert']) => {
            return supabase.from('entrepreneurs').insert(data).select().single();
        },
        getById: async (id: string) => {
            return supabase.from('entrepreneurs').select('*').eq('id', id).single();
        },
        getByEmail: async (email: string) => {
            return supabase.from('entrepreneurs').select('*').eq('email', email).single();
        }
    },

    // === GESPRÄCHE ===
    conversations: {
        create: async (data: Database['public']['Tables']['conversations']['Insert']) => {
            return supabase.from('conversations').insert(data).select().single();
        },
        update: async (id: string, data: Database['public']['Tables']['conversations']['Update']) => {
            return supabase.from('conversations').update(data).eq('id', id).select().single();
        },
        getByEntrepreneur: async (entrepreneurId: string) => {
            return supabase.from('conversations').select('*').eq('entrepreneur_id', entrepreneurId).order('created_at', { ascending: false });
        },
        addMessage: async (id: string, message: { type: 'bot' | 'user'; content: string; timestamp: string }) => {
            const { data: conversation } = await supabase.from('conversations').select('messages').eq('id', id).single();
            const messages = conversation?.messages || [];
            messages.push(message);
            return supabase.from('conversations').update({ messages }).eq('id', id).select().single();
        }
    },

    // === LASTENHEFTE ===
    specifications: {
        create: async (data: Database['public']['Tables']['specifications']['Insert']) => {
            return supabase.from('specifications').insert(data).select().single();
        },
        update: async (id: string, data: Database['public']['Tables']['specifications']['Update']) => {
            return supabase.from('specifications').update(data).eq('id', id).select().single();
        },
        getById: async (id: string) => {
            return supabase.from('specifications').select('*, entrepreneur:entrepreneurs(*)').eq('id', id).single();
        },
        getByEntrepreneur: async (entrepreneurId: string) => {
            return supabase.from('specifications').select('*').eq('entrepreneur_id', entrepreneurId).order('created_at', { ascending: false });
        }
    },

    // === ENTWÜRFE ===
    drafts: {
        create: async (data: Database['public']['Tables']['drafts']['Insert']) => {
            return supabase.from('drafts').insert(data).select().single();
        },
        update: async (id: string, data: Database['public']['Tables']['drafts']['Update']) => {
            return supabase.from('drafts').update(data).eq('id', id).select().single();
        },
        getById: async (id: string) => {
            return supabase.from('drafts').select('*, specification:specifications(*, entrepreneur:entrepreneurs(*))').eq('id', id).single();
        },
        getBySpecification: async (specificationId: string) => {
            return supabase.from('drafts').select('*').eq('specification_id', specificationId).order('created_at', { ascending: false });
        }
    },

    // === AUFTRÄGE ===
    orders: {
        create: async (data: Database['public']['Tables']['orders']['Insert']) => {
            return supabase.from('orders').insert(data).select().single();
        },
        update: async (id: string, data: Database['public']['Tables']['orders']['Update']) => {
            return supabase.from('orders').update(data).eq('id', id).select().single();
        },
        getById: async (id: string) => {
            return supabase.from('orders').select('*, draft:drafts(*, specification:specifications(*, entrepreneur:entrepreneurs(*)))').eq('id', id).single();
        },
        getAll: async (status?: string) => {
            let query = supabase.from('orders').select('*, draft:drafts(*, specification:specifications(*, entrepreneur:entrepreneurs(*)))');
            if (status) {
                query = query.eq('status', status);
            }
            return query.order('created_at', { ascending: false });
        }
    },

    // === FILE STORAGE ===
    storage: {
        uploadDraftFile: async (draftId: string, file: File) => {
            const fileName = `${draftId}/${Date.now()}-${file.name}`;
            const { data, error } = await supabase.storage.from('drafts').upload(fileName, file);
            if (error) throw error;
            const { data: { publicUrl } } = supabase.storage.from('drafts').getPublicUrl(fileName);
            return publicUrl;
        },
        uploadDocument: async (entrepreneurId: string, file: File) => {
            const fileName = `${entrepreneurId}/${Date.now()}-${file.name}`;
            const { data, error } = await supabase.storage.from('documents').upload(fileName, file);
            if (error) throw error;
            const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(fileName);
            return publicUrl;
        },
        deleteFile: async (bucket: 'drafts' | 'documents', path: string) => {
            return supabase.storage.from(bucket).remove([path]);
        }
    }
};

export default supabase;
