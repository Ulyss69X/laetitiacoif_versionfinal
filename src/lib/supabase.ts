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
    storage: localStorage,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
});

// Handle session errors
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.error("Error getting session:", error);
    localStorage.clear();
    window.location.reload();
  }
});

// Handle auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
    // Clear local storage and reload on sign out or token refresh failure
    if (!session) {
      localStorage.clear();
      window.location.reload();
    }
  }
});