
import { createClient } from '@supabase/supabase-js';

// No ambiente do AI Studio, estas variáveis são injetadas automaticamente.
// Certifique-se de que o URL e a KEY no painel de segredos batem com o seu projeto.
const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://cwqoxqidigcwjqtnpdcj.supabase.co';
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_7zfpTH2wP0Izq-6nJ8ijZg_GIJtSvBo';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  db: {
    schema: 'public'
  }
});
