const Analyzers = {
  blockedWords: [
    "bodoh",
    "goblok",
    "anjing",
    "babi",
    "bangsat",
    "tolol",
    "idiot",
    "stupid",
    "fuck",
    "shit",
    "bitch",
    "asshole",
    "kontol",
    "memek",
    "ngentot",
    "jancok",
    "bajingan",
    "brengsek",
    "kampret",
    "tai",
    "bangke",
    "brengsek",
    "sialan",
    "gila",
    "sinting",
    "tolol",
    "bego",
    "brengsek",
    "anjim",
    "anjing",
    "anjir",
    "anjrit",
    "anjrot",
    "asu",
    "babi",
    "bacot",
    "bajingan",
    "banci",
    "bangke",
    "bangor",
    "bangsat",
    "bego",
    "bejad",
    "bencong",
    "bencong",
    "bodat",
    "bugil",
    "bundir",
    "bunuh",
    "burik",
    "burit",
    "cawek",
    "cemen",
    "cipok",
    "cium",
    "colai",
    "coli",
    "colmek",
    "cukimai",
    "cukimay",
    "culun",
    "cumbu",
    "dancuk",
    "dewasa",
    "dick",
    "dildo",
    "encuk",
    "gay",
    "gei",
    "gembel",
    "gey",
    "gigolo",
    "gila",
    "goblog",
    "goblok",
    "haram",
    "hencet",
    "hentai",
    "idiot",
    "jablai",
    "jablay",
    "jancok",
    "jancuk",
    "jangkik",
    "jembut",
    "jilat",
    "jingan",
    "kampang",
    "kampang",
    "keparat",
    "kimak",
    "kirik",
    "klentit",
    "klitoris",
    "konthol",
    "kontol",
    "koplok",
    "kunyuk",
    "kutang",
    "kutis",
    "kwontol",
    "lonte",
    "maho",
    "masturbasi",
    "matane",
    "mati",
    "memek",
    "mesum",
    "modar",
    "modyar",
    "mokad",
    "najis",
    "nazi",
    "ndhasmu",
    "nenen",
    "ngentot",
    "ngolom",
    "ngulum",
    "nigga",
    "nigger",
    "onani",
    "orgasme",
    "paksa",
    "pantat",
    "pantek",
    "pecun",
    "peli",
    "penis",
    "pentil",
    "pepek",
    "perek",
    "perek",
    "perkosa",
    "piatu",
    "porno",
    "pukimak",
    "qontol",
    "selangkang",
    "sempak",
    "senggama",
    "setan",
    "setubuh",
    "silet",
    "silit",
    "sinting",
    "sodomi",
    "stres",
    "telanjang",
    "telaso",
    "tete",
    "tewas",
    "titit",
    "togel",
    "toket",
    "tolol",
    "tusbol",
    "urin",
    "vagina",
    "xxx",
    "yateam",
    "yatim",
  ],
  blockedPhrases: [
    "kamu tidak berguna",
    "kalian tidak berguna",
    "sekolah ini bodoh",
    "guru ini bodoh",
    "dasar bodoh",
    "pergi ke neraka",
    "saya akan menyakiti",
    "ingin menyakiti",
    "ancaman kepada",
    "bunuh diri",
  ],
  positiveWords: [
    "bagus",
    "keren",
    "mantap",
    "terbaik",
    "hebat",
    "baik",
    "membantu",
    "bermanfaat",
    "suka",
    "senang",
    "good",
    "great",
    "excellent",
    "amazing",
    "terima kasih",
    "thanks",
  ],
  negativeWords: [
    "jelek",
    "buruk",
    "parah",
    "hancur",
    "kecewa",
    "benci",
    "keluhan",
    "masalah",
    "mengganggu",
    "lambat",
    "rusak",
    "sulit",
    "kurang",
    "bad",
    "terrible",
    "awful",
    "disappointed",
  ],
  negations: ["tidak", "tak", "bukan", "belum", "jangan", "kurang"],

  normalize: (text) =>
    text
      .toLowerCase()
      .normalize("NFKC")
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .trim(),

  containsTerm: (text, term) => {
    const normalizedTerm = Analyzers.normalize(term);
    return new RegExp(
      `(^|\\s)${normalizedTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=\\s|$)`,
      "u",
    ).test(text);
  },

  checkToxicity: (text) => {
    const normalizedText = Analyzers.normalize(text);
    return (
      Analyzers.blockedPhrases.some((phrase) =>
        normalizedText.includes(Analyzers.normalize(phrase)),
      ) ||
      Analyzers.blockedWords.some((word) =>
        Analyzers.containsTerm(normalizedText, word),
      )
    );
  },

  getSentiment: (text) => {
    const normalizedText = Analyzers.normalize(text);
    const words = normalizedText.split(" ");
    let score = 0;

    const scoreTerms = (terms, value) =>
      terms.forEach((term) => {
        const normalizedTerm = Analyzers.normalize(term);
        const matched = normalizedTerm.includes(" ")
          ? normalizedText.includes(normalizedTerm)
          : Analyzers.containsTerm(normalizedText, normalizedTerm);
        if (!matched) return;

        const termIndex = words.indexOf(normalizedTerm.split(" ")[0]);
        const previousWord = termIndex > 0 ? words[termIndex - 1] : "";
        score += Analyzers.negations.includes(previousWord) ? -value : value;
      });

    scoreTerms(Analyzers.positiveWords, 1);
    scoreTerms(Analyzers.negativeWords, -1);

    if (score > 0) return "POSITIVE";
    if (score < 0) return "NEGATIVE";
    return "NEUTRAL";
  },

  analyze: (text) => ({
    isToxic: Analyzers.checkToxicity(text),
    sentiment: Analyzers.getSentiment(text),
  }),
};

window.Analyzers = Analyzers;

const Aspiration = {
  // Submit new aspiration
  submit: async (formData) => {
    const supabase = window.getSupabaseClient();
    if (!supabase) throw new Error("Database connection failed");

    // Toxic Filter Check
    const analysis = Analyzers.analyze(formData.message);
    const isToxic = analysis.isToxic;
    if (isToxic) {
      // You can either block it completely, or flag it. The requirement says filter, so we block.
      throw new Error(
        "Pesan Anda mengandung kata-kata yang tidak pantas (Toxic). Mohon perbaiki bahasa Anda.",
      );
    }

    const sentiment = analysis.sentiment;

    // Handle file upload if exists
    let attachmentUrl = null;
    let attachmentName = null;

    if (formData.file) {
      const file = formData.file;
      if (file.size > window.APP_CONFIG.MAX_FILE_SIZE) {
        throw new Error("Ukuran file melebihi 10MB");
      }
      if (!window.APP_CONFIG.ALLOWED_FILE_TYPES.includes(file.type)) {
        throw new Error("Tipe file tidak didukung");
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("aspiration-attachments")
        .upload(fileName, file);

      if (uploadError) throw new Error("Gagal mengunggah lampiran");

      const { data: urlData } = supabase.storage
        .from("aspiration-attachments")
        .getPublicUrl(fileName);

      attachmentUrl = urlData.publicUrl;
      attachmentName = file.name;
    }

    // Insert to database
    const { data, error } = await supabase
      .from("aspirations")
      .insert([
        {
          category: formData.category,
          message: formData.message,
          name: formData.anonymous ? null : formData.name,
          email: formData.anonymous ? null : formData.email,
          identity_type: formData.anonymous ? null : formData.identityType,
          anonymous: formData.anonymous,
          aspiration_type: formData.aspirationType || "ASPA",
          class_code: formData.classCode,
          access_token_hash: formData.accessTokenHash,
          group_token: formData.groupToken || null,
          sentiment: sentiment,
          is_toxic: false,
          attachment_url: attachmentUrl,
          attachment_name: attachmentName,
        },
      ])
      .select("reference_number")
      .single();

    if (error) throw error;
    return data.reference_number;
  },

  // Lookup status
  lookup: async (referenceNumber) => {
    const supabase = window.getSupabaseClient();
    if (!supabase) throw new Error("Database connection failed");

    const { data, error } = await supabase
      .from("aspirations")
      .select("reference_number, category, status, created_at")
      .eq("reference_number", referenceNumber.toUpperCase())
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw error;
    }
    return data;
  },
};

window.Aspiration = Aspiration;
