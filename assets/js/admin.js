const Admin = {
  getCurrentProfile: async () => {
    const supabase = window.getSupabaseClient();
    const session = await Auth.checkSession();
    if (!supabase || !session) return null;

    const { data, error } = await supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", session.user.id)
      .single();

    if (error) throw error;
    return data;
  },

  getFormSettings: async () => {
    const supabase = window.getSupabaseClient();
    if (!supabase) return null;
    const { data, error } = await supabase
      .from("form_settings")
      .select("is_open")
      .eq("setting_key", "public_form")
      .single();
    if (error) throw error;
    return data;
  },

  setFormOpen: async (isOpen) => {
    const supabase = window.getSupabaseClient();
    const session = await Auth.checkSession();
    if (!supabase || !session) throw new Error("Sesi admin tidak ditemukan");
    const { error } = await supabase
      .from("form_settings")
      .update({
        is_open: isOpen,
        updated_by: session.user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("setting_key", "public_form");
    if (error) throw error;
    return true;
  },

  // Fetch dashboard metrics
  getMetrics: async () => {
    const supabase = window.getSupabaseClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from("aspirations")
      .select("status, sentiment");

    if (error) throw error;

    const metrics = {
      total: 0,
      new: 0,
      in_progress: 0,
      resolved: 0,
      positive: 0,
      negative: 0,
    };
    metrics.total = data.length;

    data.forEach((item) => {
      if (item.status === "NEW") metrics.new++;
      if (item.status === "IN_PROGRESS" || item.status === "REVIEWING")
        metrics.in_progress++;
      if (item.status === "RESOLVED") metrics.resolved++;

      if (item.sentiment === "POSITIVE") metrics.positive++;
      if (item.sentiment === "NEGATIVE") metrics.negative++;
    });

    return metrics;
  },

  // Fetch all aspirations for table
  getAspirations: async (filters = {}) => {
    const supabase = window.getSupabaseClient();
    if (!supabase) return null;

    let query = supabase
      .from("aspirations")
      .select("*")
      .order("created_at", { ascending: false });

    if (filters.status) query = query.eq("status", filters.status);
    if (filters.category) query = query.eq("category", filters.category);
    if (filters.search) {
      query = query.or(
        `reference_number.ilike.%${filters.search}%,message.ilike.%${filters.search}%`,
      );
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Update aspiration status
  updateStatus: async (id, status) => {
    const supabase = window.getSupabaseClient();
    if (!supabase) return null;

    const { error } = await supabase
      .from("aspirations")
      .update({ status: status })
      .eq("id", id);

    if (error) throw error;

    // Log activity
    await Admin.logActivity(id, `Status updated to ${status}`);
    return true;
  },

  // Add a note
  addNote: async (aspirationId, note) => {
    const supabase = window.getSupabaseClient();
    const session = await Auth.checkSession();
    if (!supabase || !session) return null;

    const { error } = await supabase.from("aspiration_notes").insert([
      {
        aspiration_id: aspirationId,
        admin_id: session.user.id,
        note: note,
      },
    ]);

    if (error) throw error;
    return true;
  },

  // Get notes for an aspiration
  getNotes: async (aspirationId) => {
    const supabase = window.getSupabaseClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("aspiration_notes")
      .select("*, profiles(full_name)")
      .eq("aspiration_id", aspirationId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data;
  },

  // Log activity (internal)
  logActivity: async (aspirationId, action, metadata = {}) => {
    const supabase = window.getSupabaseClient();
    const session = await Auth.checkSession();
    if (!supabase || !session) return;

    await supabase.from("aspiration_activity").insert([
      {
        aspiration_id: aspirationId,
        admin_id: session.user.id,
        action: action,
        metadata: metadata,
      },
    ]);
  },
};

window.Admin = Admin;
