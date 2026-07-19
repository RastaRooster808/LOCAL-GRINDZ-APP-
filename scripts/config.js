// Supabase client configuration — keep anon key publishable only.
// Do NOT commit service_role keys to the repository. For server-side privileged
// operations, use a repository/CI secret named SUPABASE_SERVICE_ROLE and load
// it at runtime (process.env.SUPABASE_SERVICE_ROLE).

// Supabase project URL
const SUPABASE_URL = 'https://pqzygehnnojdttmqadrz.supabase.co';

// Publishable anon key for client-side usage. If you need to rotate this,
// replace it via a secrets manager and update deployments.
const SUPABASE_ANON_KEY = 'sb_publishable_9WOW1yPsItJq5-NFThn-5Q_KW-ktJfj';

export { SUPABASE_URL, SUPABASE_ANON_KEY };