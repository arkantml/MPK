const Auth = {
  // Login admin
  login: async (email, password) => {
    const supabase = window.getSupabaseClient();
    if (!supabase) return { error: { message: 'Supabase not initialized' } };

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
    
    return { data, error };
  },

  // Logout admin
  logout: async () => {
    const supabase = window.getSupabaseClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    window.location.href = 'admin-login.html';
  },

  // Check session and route guard
  checkSession: async (requireAuth = false, redirectUrl = 'admin-login.html') => {
    const supabase = window.getSupabaseClient();
    if (!supabase) return null;

    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (requireAuth && !session) {
      window.location.href = redirectUrl;
      return null;
    }
    
    // If logged in and on login page, redirect to admin
    if (session && window.location.pathname.includes('admin-login.html')) {
        window.location.href = 'admin.html';
    }

    return session;
  }
};

window.Auth = Auth;
