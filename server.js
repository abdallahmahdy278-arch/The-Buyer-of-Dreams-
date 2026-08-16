const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();

const PORT = process.env.PORT || 3000;

// كلمة السر الأساسية تأتي من Render.
// القيمة الاحتياطية للتشغيل المحلي فقط.
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "a1572020";

const DATA_DIR = path.join(__dirname, "data");
const CONTENT_FILE = path.join(DATA_DIR, "content.json");
const MESSAGES_FILE = path.join(DATA_DIR, "messages.json");

// جلسات الإدارة
const adminSessions = new Set();

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// الملفات العامة
app.use(express.static(__dirname));

/* =========================================================
   HELPERS
========================================================= */

function generateId() {
  return crypto.randomBytes(12).toString("hex");
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    console.error("JSON read error:", error);
    return null;
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(
    filePath,
    JSON.stringify(data, null, 2),
    "utf8"
  );
}

function ensureDataFiles() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(CONTENT_FILE)) {
    const defaultContent = {
      site: {
        name: "بائعة الأحلام",
        description: "الموقع الأدبي الشخصي لمشتري الأحلام"
      },

      home: {
        mainQuote:
          "أنا لا أكتب لأُقال إنني كتبت، بل أكتب لأن في القلب كلامًا إن لم يخرج اختنق.",

        introText:
          "هذا فضاء أدبي شخصي يضم الكتاب والقصائد والمقتطفات.",

        heroImage:
          "https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=1200&auto=format&fit=crop",

        featuredExcerpt:
          "في بعض الأرواح نافذة صغيرة، تطل منها القصيدة كلما أغلقت الحياة أبوابها."
      },

      book: {
        title: "كتاب بائعة الأحلام",

        description:
          "نبذة مختصرة عن كتاب بائعة الأحلام، تُكتب وتُعدّل من لوحة الإدارة.",

        coverImage:
          "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=900&auto=format&fit=crop",

        printLink: "",

        pdfLink: "",

        chapters: []
      },

      poems: [],

      quotes: [],

      about: {
        bio: ""
      },

      socials: {
        facebook: "",
        instagram: "",
        youtube: ""
      },

      style: {
        primary: "#8B0000",
        gold: "#D4AF37",
        text: "#2A2521",
        muted: "#78716C",

        bodyFont: "Tajawal",
        titleFont: "Aref Ruqaa",

        bodySize: 18,
        titleSize: 36
      }
    };

    writeJson(CONTENT_FILE, defaultContent);
  }

  if (!fs.existsSync(MESSAGES_FILE)) {
    writeJson(MESSAGES_FILE, {
      messages: []
    });
  }
}

/* =========================================================
   AUTH
========================================================= */

function getToken(req) {
  const authorization = req.headers.authorization || "";

  return authorization
    .replace(/^Bearer\s+/i, "")
    .trim();
}

function requireAdmin(req, res, next) {
  const token = getToken(req);

  if (!token || !adminSessions.has(token)) {
    return res.status(401).json({
      message: "انتهت جلسة الدخول أو غير مصرح لك."
    });
  }

  next();
}

/* =========================================================
   YOUTUBE
========================================================= */

function getYouTubeEmbedUrl(url) {
  if (!url) return "";

  try {
    const parsed = new URL(url);

    // https://youtu.be/VIDEO_ID
    if (
      parsed.hostname === "youtu.be" ||
      parsed.hostname === "www.youtu.be"
    ) {
      const videoId = parsed.pathname
        .replace("/", "")
        .split("/")[0];

      return videoId
        ? `https://www.youtube.com/embed/${videoId}`
        : "";
    }

    // https://www.youtube.com/watch?v=VIDEO_ID
    if (
      parsed.hostname.includes("youtube.com")
    ) {
      const videoId = parsed.searchParams.get("v");

      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }

      // https://www.youtube.com/embed/VIDEO_ID
      const parts = parsed.pathname.split("/");

      if (
        parts[1] === "embed" &&
        parts[2]
      ) {
        return `https://www.youtube.com/embed/${parts[2]}`;
      }

      // https://www.youtube.com/shorts/VIDEO_ID
      if (
        parts[1] === "shorts" &&
        parts[2]
      ) {
        return `https://www.youtube.com/embed/${parts[2]}`;
      }
    }

    return "";
  } catch (error) {
    return "";
  }
}

/* =========================================================
   STARTUP
========================================================= */

ensureDataFiles();

/* =========================================================
   PAGES
========================================================= */

app.get("/", (req, res) => {
  res.sendFile(
    path.join(__dirname, "index.html")
  );
});

app.get("/admin", (req, res) => {
  res.sendFile(
    path.join(__dirname, "admin.html")
  );
});

app.get("/admin.html", (req, res) => {
  res.sendFile(
    path.join(__dirname, "admin.html")
  );
});

/* =========================================================
   PUBLIC CONTENT
========================================================= */

app.get("/api/content", (req, res) => {
  const content = readJson(CONTENT_FILE);

  if (!content) {
    return res.status(500).json({
      message: "تعذر قراءة محتوى الموقع."
    });
  }

  res.json(content);
});

/* =========================================================
   ADMIN LOGIN
========================================================= */

app.post("/api/admin/login", (req, res) => {
  const password = String(
    req.body?.password || ""
  );

  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({
      message: "كلمة المرور غير صحيحة."
    });
  }

  const token = generateId();

  adminSessions.add(token);

  res.json({
    message: "تم تسجيل الدخول بنجاح.",
    token
  });
});

/* =========================================================
   ADMIN LOGOUT
========================================================= */

app.post(
  "/api/admin/logout",
  requireAdmin,
  (req, res) => {
    const token = getToken(req);

    adminSessions.delete(token);

    res.json({
      message: "تم تسجيل الخروج."
    });
  }
);

/* =========================================================
   ADMIN CHECK SESSION
========================================================= */

app.get(
  "/api/admin/check",
  requireAdmin,
  (req, res) => {
    res.json({
      authenticated: true
    });
  }
);

/* =========================================================
   ADMIN GET MESSAGES
========================================================= */

app.get(
  "/api/admin/messages",
  requireAdmin,
  (req, res) => {
    const data = readJson(MESSAGES_FILE);

    if (!data) {
      return res.status(500).json({
        message: "تعذر قراءة الرسائل."
      });
    }

    res.json(data);
  }
);

/* =========================================================
   ADMIN UPDATE SECTION
========================================================= */

app.post(
  "/api/admin/update",
  requireAdmin,
  (req, res) => {
    const { section, payload } = req.body;

    if (
      !section ||
      !payload ||
      typeof payload !== "object"
    ) {
      return res.status(400).json({
        message: "بيانات غير صحيحة."
      });
    }

    const data = readJson(CONTENT_FILE);

    if (!data) {
      return res.status(500).json({
        message: "تعذر قراءة المحتوى."
      });
    }

    data[section] = {
      ...(data[section] || {}),
      ...payload
    };

    writeJson(CONTENT_FILE, data);

    res.json({
      message: "تم حفظ التعديلات بنجاح."
    });
  }
);

/* =========================================================
   BOOK
========================================================= */

app.post(
  "/api/admin/book",
  requireAdmin,
  (req, res) => {
    const data = readJson(CONTENT_FILE);

    if (!data) {
      return res.status(500).json({
        message: "تعذر قراءة المحتوى."
      });
    }

    const {
      title,
      description,
      coverImage,
      printLink,
      pdfLink
    } = req.body;

    data.book = {
      ...(data.book || {}),
      title: title || "",
      description: description || "",
      coverImage: coverImage || "",
      printLink: printLink || "",
      pdfLink: pdfLink || "",
      chapters: data.book?.chapters || []
    };

    writeJson(CONTENT_FILE, data);

    res.json({
      message: "تم حفظ بيانات الكتاب."
    });
  }
);

/* =========================================================
   BOOK CHAPTERS
========================================================= */

app.post(
  "/api/admin/book/chapters",
  requireAdmin,
  (req, res) => {
    const data = readJson(CONTENT_FILE);

    if (!data) {
      return res.status(500).json({
        message: "تعذر قراءة المحتوى."
      });
    }

    data.book = data.book || {};
    data.book.chapters =
      data.book.chapters || [];

    const chapterId =
      req.body.chapterId || req.body.id || "";

    const title = String(
      req.body.title || ""
    ).trim();

    const content = String(
      req.body.content || ""
    );

    const youtubeUrl = String(
      req.body.youtubeUrl || ""
    ).trim();

    if (!title) {
      return res.status(400).json({
        message: "عنوان الفصل مطلوب."
      });
    }

    if (!content.trim()) {
      return res.status(400).json({
        message: "نص الفصل مطلوب."
      });
    }

    const chapter = {
      id: chapterId || generateId(),
      title,
      content,
      youtubeUrl,
      embedUrl:
        getYouTubeEmbedUrl(youtubeUrl)
    };

    if (chapterId) {
      const index =
        data.book.chapters.findIndex(
          item => item.id === chapterId
        );

      if (index === -1) {
        return res.status(404).json({
          message: "الفصل غير موجود."
        });
      }

      data.book.chapters[index] = chapter;
    } else {
      data.book.chapters.push(chapter);
    }

    writeJson(CONTENT_FILE, data);

    res.json({
      message: "تم حفظ الفصل بنجاح."
    });
  }
);

app.delete(
  "/api/admin/book/chapters/:id",
  requireAdmin,
  (req, res) => {
    const data = readJson(CONTENT_FILE);

    if (!data) {
      return res.status(500).json({
        message: "تعذر قراءة المحتوى."
      });
    }

    data.book = data.book || {};

    data.book.chapters =
      (data.book.chapters || []).filter(
        chapter =>
          chapter.id !== req.params.id
      );

    writeJson(CONTENT_FILE, data);

    res.json({
      message: "تم حذف الفصل."
    });
  }
);

/* =========================================================
   POEMS
========================================================= */

app.post(
  "/api/admin/poems",
  requireAdmin,
  (req, res) => {
    const data = readJson(CONTENT_FILE);

    if (!data) {
      return res.status(500).json({
        message: "تعذر قراءة المحتوى."
      });
    }

    data.poems = data.poems || [];

    const poemId =
      req.body.poemId ||
      req.body.id ||
      "";

    const title = String(
      req.body.title || ""
    ).trim();

    const type =
      req.body.type === "عمودي"
        ? "عمودي"
        : "حر";

    const reason = String(
      req.body.reason || ""
    );

    const content = String(
      req.body.content || ""
    );

    const font =
      String(req.body.font || "Amiri");

    const size =
      Number(req.body.size) || 22;

    const color =
      String(req.body.color || "#2A2521");

    if (!title) {
      return res.status(400).json({
        message: "اسم القصيدة مطلوب."
      });
    }

    if (!content.trim()) {
      return res.status(400).json({
        message: "نص القصيدة مطلوب."
      });
    }

    const poem = {
      id: poemId || generateId(),
      title,
      type,
      reason,
      content,
      font,
      size,
      color
    };

    if (poemId) {
      const index =
        data.poems.findIndex(
          item => item.id === poemId
        );

      if (index === -1) {
        return res.status(404).json({
          message: "القصيدة غير موجودة."
        });
      }

      data.poems[index] = poem;
    } else {
      data.poems.push(poem);
    }

    writeJson(CONTENT_FILE, data);

    res.json({
      message: "تم حفظ القصيدة بنجاح."
    });
  }
);

app.delete(
  "/api/admin/poems/:id",
  requireAdmin,
  (req, res) => {
    const data = readJson(CONTENT_FILE);

    if (!data) {
      return res.status(500).json({
        message: "تعذر قراءة المحتوى."
      });
    }

    data.poems =
      (data.poems || []).filter(
        poem =>
          poem.id !== req.params.id
      );

    writeJson(CONTENT_FILE, data);

    res.json({
      message: "تم حذف القصيدة."
    });
  }
);

/* =========================================================
   POEM / QUOTE ORDER
========================================================= */

app.post(
  "/api/admin/reorder",
  requireAdmin,
  (req, res) => {
    const {
      collection,
      ids
    } = req.body;

    const allowed = [
      "poems",
      "quotes"
    ];

    if (
      !allowed.includes(collection) ||
      !Array.isArray(ids)
    ) {
      return res.status(400).json({
        message: "بيانات الترتيب غير صحيحة."
      });
    }

    const data = readJson(CONTENT_FILE);

    const current =
      data[collection] || [];

    const map =
      new Map(
        current.map(item => [
          item.id,
          item
        ])
      );

    const reordered = [];

    ids.forEach(itemId => {
      if (map.has(itemId)) {
        reordered.push(
          map.get(itemId)
        );

        map.delete(itemId);
      }
    });

    map.forEach(item => {
      reordered.push(item);
    });

    data[collection] = reordered;

    writeJson(CONTENT_FILE, data);

    res.json({
      message: "تم تحديث الترتيب."
    });
  }
);

/* =========================================================
   QUOTES
========================================================= */

app.post(
  "/api/admin/quotes",
  requireAdmin,
  (req, res) => {
    const data = readJson(CONTENT_FILE);

    if (!data) {
      return res.status(500).json({
        message: "تعذر قراءة المحتوى."
      });
    }

    data.quotes = data.quotes || [];

    const quoteId =
      req.body.quoteId ||
      req.body.id ||
      "";

    const title =
      String(
        req.body.title ||
        "مقتطف شعري"
      ).trim();

    const text =
      String(
        req.body.text || ""
      );

    const font =
      String(
        req.body.font ||
        "Amiri"
      );

    const size =
      Number(req.body.size) || 24;

    const color =
      String(
        req.body.color ||
        "#2A2521"
      );

    if (!text.trim()) {
      return res.status(400).json({
        message: "نص المقتطف مطلوب."
      });
    }

    const quote = {
      id: quoteId || generateId(),
      title,
      text,
      font,
      size,
      color
    };

    if (quoteId) {
      const index =
        data.quotes.findIndex(
          item =>
            item.id === quoteId
        );

      if (index === -1) {
        return res.status(404).json({
          message: "المقتطف غير موجود."
        });
      }

      data.quotes[index] = quote;
    } else {
      data.quotes.push(quote);
    }

    writeJson(CONTENT_FILE, data);

    res.json({
      message: "تم حفظ المقتطف بنجاح."
    });
  }
);

app.delete(
  "/api/admin/quotes/:id",
  requireAdmin,
  (req, res) => {
    const data = readJson(CONTENT_FILE);

    if (!data) {
      return res.status(500).json({
        message: "تعذر قراءة المحتوى."
      });
    }

    data.quotes =
      (data.quotes || []).filter(
        quote =>
          quote.id !== req.params.id
      );

    writeJson(CONTENT_FILE, data);

    res.json({
      message: "تم حذف المقتطف."
    });
  }
);

/* =========================================================
   ABOUT
========================================================= */

app.post(
  "/api/admin/about",
  requireAdmin,
  (req, res) => {
    const data = readJson(CONTENT_FILE);

    data.about = {
      ...(data.about || {}),
      bio: String(
        req.body.bio || ""
      )
    };

    writeJson(CONTENT_FILE, data);

    res.json({
      message: "تم حفظ السيرة الذاتية."
    });
  }
);

/* =========================================================
   SOCIAL LINKS
========================================================= */

app.post(
  "/api/admin/socials",
  requireAdmin,
  (req, res) => {
    const data = readJson(CONTENT_FILE);

    data.socials = {
      facebook:
        String(
          req.body.facebook || ""
        ).trim(),

      instagram:
        String(
          req.body.instagram || ""
        ).trim(),

      youtube:
        String(
          req.body.youtube || ""
        ).trim()
    };

    writeJson(CONTENT_FILE, data);

    res.json({
      message: "تم حفظ روابط التواصل."
    });
  }
);

/* =========================================================
   SITE STYLE
========================================================= */

app.post(
  "/api/admin/style",
  requireAdmin,
  (req, res) => {
    const data = readJson(CONTENT_FILE);

    data.style = {
      ...(data.style || {}),

      primary:
        req.body.primary ||
        data.style?.primary ||
        "#8B0000",

      gold:
        req.body.gold ||
        data.style?.gold ||
        "#D4AF37",

      text:
        req.body.text ||
        data.style?.text ||
        "#2A2521",

      muted:
        req.body.muted ||
        data.style?.muted ||
        "#78716C",

      bodyFont:
        req.body.bodyFont ||
        data.style?.bodyFont ||
        "Tajawal",

      titleFont:
        req.body.titleFont ||
        data.style?.titleFont ||
        "Aref Ruqaa",

      bodySize:
        Number(req.body.bodySize) ||
        data.style?.bodySize ||
        18,

      titleSize:
        Number(req.body.titleSize) ||
        data.style?.titleSize ||
        36
    };

    writeJson(CONTENT_FILE, data);

    res.json({
      message: "تم حفظ إعدادات التصميم."
    });
  }
);

/* =========================================================
   ANONYMOUS CONTACT MESSAGE
========================================================= */

app.post(
  "/api/contact",
  (req, res) => {
    const message =
      String(
        req.body?.message || ""
      ).trim();

    if (!message) {
      return res.status(400).json({
        message: "اكتب الرسالة أولًا."
      });
    }

    const data =
      readJson(MESSAGES_FILE);

    if (!data) {
      return res.status(500).json({
        message: "تعذر حفظ الرسالة."
      });
    }

    const newMessage = {
      id: generateId(),

      // الرسالة فقط بدون اسم أو بريد
      message,

      createdAt:
        new Date().toISOString(),

      anonymous: true,

      read: false
    };

    data.messages =
      data.messages || [];

    data.messages.unshift(
      newMessage
    );

    writeJson(
      MESSAGES_FILE,
      data
    );

    res.json({
      message:
        "تم إرسال الرسالة إلى مشتري الأحلام."
    });
  }
);

/* =========================================================
   MARK MESSAGE AS READ
========================================================= */

app.post(
  "/api/admin/messages/:id/read",
  requireAdmin,
  (req, res) => {
    const data =
      readJson(MESSAGES_FILE);

    if (!data) {
      return res.status(500).json({
        message: "تعذر قراءة الرسائل."
      });
    }

    const message =
      (data.messages || [])
        .find(
          item =>
            item.id ===
            req.params.id
        );

    if (!message) {
      return res.status(404).json({
        message: "الرسالة غير موجودة."
      });
    }

    message.read = true;

    writeJson(
      MESSAGES_FILE,
      data
    );

    res.json({
      message: "تم تحديد الرسالة كمقروءة."
    });
  }
);

/* =========================================================
   DELETE MESSAGE
========================================================= */

app.delete(
  "/api/admin/messages/:id",
  requireAdmin,
  (req, res) => {
    const data =
      readJson(MESSAGES_FILE);

    if (!data) {
      return res.status(500).json({
        message: "تعذر قراءة الرسائل."
      });
    }

    data.messages =
      (data.messages || [])
        .filter(
          item =>
            item.id !==
            req.params.id
        );

    writeJson(
      MESSAGES_FILE,
      data
    );

    res.json({
      message: "تم حذف الرسالة."
    });
  }
);

/* =========================================================
   SERVER
========================================================= */

app.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      `Server running on port ${PORT}`
    );
  }
);