
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cwqoxqidigcwjqtnpdcj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_7zfpTH2wP0Izq-6nJ8ijZg_GIJtSvBo';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
