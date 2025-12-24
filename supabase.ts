
import { createClient } from '@supabase/supabase-js';

// No ambiente do AI Studio ou Vite, usamos as variáveis de ambiente ou fallbacks
const env = (import.meta as any).env;

const SUPABASE_URL = env?.VITE_SUPABASE_URL || 'https://cwqoxqidigcwjqtnpdcj.supabase.co';
const SUPABASE_ANON_KEY = env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_7zfpTH2wP0Izq-6nJ8ijZg_GIJtSvBo';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});
