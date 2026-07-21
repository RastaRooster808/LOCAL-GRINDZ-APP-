import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://pqzygehnnojdttmqadrz.supabase.co';
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_9WOW1yPsItJq5-NFThn-5Q_KW-ktJfj';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
