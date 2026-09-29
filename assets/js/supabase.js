let supabaseClient = null;

function initSupabase() {
  if (window.APP_CONFIG.SUPABASE_URL && window.APP_CONFIG.SUPABASE_ANON_KEY) {
    if (typeof supabase !== 'undefined') {
      supabaseClient = supabase.createClient(
        window.APP_CONFIG.SUPABASE_URL,
        window.APP_CONFIG.SUPABASE_ANON_KEY
      );
      console.log('Supabase client initialized successfully.');
    } else {
      console.error('Supabase library not loaded.');
    }
  } else {
    console.warn('Supabase URL or Key is missing. Check your configuration.');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initSupabase();
});

window.getSupabaseClient = () => supabaseClient;
