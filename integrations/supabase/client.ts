import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rhfjbughppnjbcrcpkjf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoZmpidWdocHBuamJjcmNwa2pmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMDI5ODgsImV4cCI6MjA3OTU3ODk4OH0.oTYA3vbBVOCG2u7Wra6itWazf9jTIrBjEuGQz_cilM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);