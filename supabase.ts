
import { createClient } from '@supabase/supabase-js';

// No Vite, as variáveis de ambiente são acessadas via import.meta.env.
// O cast para 'any' evita erros de tipagem no TypeScript para a propriedade 'env'.
const env = (import.meta as any).env;

// Definimos as chaves como fallback caso o ambiente (como o preview local ou build inicial) 
// não as forneça via variáveis de ambiente. Isso impede o erro "supabaseUrl is required".
const SUPABASE_URL = env?.VITE_SUPABASE_URL || 'https://cwqoxqidigcwjqtnpdcj.supabase.co';
const SUPABASE_ANON_KEY = env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_7zfpTH2wP0Izq-6nJ8ijZg_GIJtSvBo';

if (!env?.VITE_SUPABASE_URL) {
  console.info("Info: O sistema está operando com credenciais de fallback. Certifique-se de configurar as Environment Variables na Vercel para produção.");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
