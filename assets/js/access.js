const ClassAccess = {
  classes: [
    "10A",
    "10B",
    "10C",
    "10D",
    "10E",
    "11A",
    "11B",
    "11C",
    "11D",
    "11E",
    "12A",
    "12B",
    "12C",
    "12D",
  ],

  hashToken: async (token) => {
    const bytes = new TextEncoder().encode(token.trim());
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  },

  verify: async (classCode, token) => {
    const supabase = window.getSupabaseClient();
    if (!supabase) throw new Error("Database connection failed");
    if (!ClassAccess.classes.includes(classCode) || !token.trim()) return false;

    const tokenHash = await ClassAccess.hashToken(token);
    const { data, error } = await supabase.rpc("verify_class_access", {
      p_class_code: classCode,
      p_token_hash: tokenHash,
    });

    if (error) throw error;
    if (data === true) {
      sessionStorage.setItem(
        "mpk_class_access",
        JSON.stringify({ classCode, tokenHash }),
      );
      return true;
    }
    return false;
  },

  getSession: () => {
    try {
      return JSON.parse(sessionStorage.getItem("mpk_class_access") || "null");
    } catch {
      return null;
    }
  },

  clear: () => sessionStorage.removeItem("mpk_class_access"),
};

window.ClassAccess = ClassAccess;
