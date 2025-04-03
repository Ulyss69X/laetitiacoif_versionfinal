import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    storage: window.localStorage,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
});

// Handle session errors
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !session)) {
    // Clear local storage and reload on sign out or token refresh failure
    window.localStorage.clear();
    window.location.reload();
  }
});

// Initialize auth state
supabase.auth.getSession().catch(() => {
  // If getting the session fails, clear storage and reload
  window.localStorage.clear();
  window.location.reload();
});