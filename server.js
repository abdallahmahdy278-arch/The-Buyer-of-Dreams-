import express from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const DATA_DIR = path.join(__dirname, "data");
const CONTENT_FILE = path.join(DATA_DIR, "content.json");
const MESSAGES_FILE = path.join(DATA_DIR, "messages.json");

/* =========================================================
   EXPRESS
========================================================= */

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

app.use(express.static(__dirname));

/* =========================================================
   ADMIN SESSIONS
========================================================= */

const adminSessions = new Map();

const SESSION_DURATION = 1000 * 60 * 60 * 12; // 12 ساعة

/* =========================================================
   HELPERS
========================================================= */

function generateId() {
  return crypto.randomBytes(12).toString("hex");
}

function ensureDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function defaultContent() {
  return {
    siteSettings: {
      siteName: "بائعة الأحلام",
      pageTitle: "بائعة الأحلام",
      primaryColor: "#8B0000",
      secondaryColor: "#D4AF37",
      backgroundColor: "#FAF8F5",
      textColor: "#1C1917",
      fontFamily: "Tajawal",
      mainFontSize: "18px"
    },

    home: {
      mainQuote:
        "أنا لا أكتب لأُقال إنني كتبت، بل أكتب لأن في القلب كلامًا إن لم يخرج اختنق.",
      introText:
        "هنا تُفتح أبواب الحنين على مهل، وتجلس القصيدة في ضوء هادئ بين كتاب قديم وقلب لا يزال يؤمن بالكلمات.",
      heroImage:
        "https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=1200&auto=format&fit=crop",
      featuredExcerpt:
        "في بعض الأرواح نافذة صغيرة، تطل منها القصيدة كلما أغلقت الحياة أبوابها."
    },

    cards: {
      book: {
        title: "كتاب بائعة الأحلام",
        description:
          "رحلة أدبية تنسج الحكاية بين الحلم والذاكرة والحنين.",
        icon: "📖",
        color: "#8B0000",
        fontFamily: "Aref Ruqaa",
        fontSize: "24px"
      },

      poems: {
        title: "القصائد",
        description: "مجموعة القصائد والدواوين.",
        icon: "✒️",
        color: "#8B0000",
        fontFamily: "Aref Ruqaa",
        fontSize: "24px"
      },

      quotes: {
        title: "مقتطفات شعرية",
        description: "أبيات وخواطر ومقتطفات قصيرة.",
        icon: "❝",
        color: "#8B0000",
        fontFamily: "Amiri",
        fontSize: "24px"
      }
    },

    book: {
      title: "كتاب بائعة الأحلام",
      shortDescription:
        "كتاب أدبي ينسج الحلم من خيوط الحنين، ويعيد ترتيب الذاكرة بلغة شاعرية دافئة.",
      coverImage:
        "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=900&auto=format&fit=crop",
      printLink: "",
      pdfLink: "",
      youtubeUrl: "",
      textColor: "#1C1917",
      fontFamily: "Amiri",
      fontSize: "20px",
      chapters: []
    },

    poems: [],

    quotes: [],

    about: {
      title: "عن الكاتب",
      bio:
        "كاتب وشاعر عربي، يكتب من جهة القلب، ويؤمن أن الكلمات ليست زينة للمعنى، بل بيت يسكنه الشعور.",
      fontFamily: "Tajawal",
      fontSize: "20px",
      textColor: "#78716C"
    },

    contact: {
      title: "أرسل الرسالة لمشتري الأحلام",
      description:
        "إن كان لديك شيء تريد قوله، يمكنك ترك رسالتك هنا.",
      socialLinks: {
        facebook: "",
        instagram: "",
        youtube: ""
      }
    }
  };
}

function defaultMessages() {
  return {
    messages: [],
    unreadCount: 0
  };
}

function readJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) {
      return fallback;
    }

    const raw = fs.readFileSync(filePath, "utf8");

    if (!raw.trim()) {
      return fallback;
    }

    return JSON.parse(raw);
  } catch (error) {
    console.error("JSON READ ERROR:", error);
    return fallback;
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
  ensureDirectory();

  if (!fs.existsSync(CONTENT_FILE)) {
    writeJson(CONTENT_FILE, defaultContent());
  }

  if (!fs.existsSync(MESSAGES_FILE)) {
    writeJson(MESSAGES_FILE, defaultMessages());
  }

  /*
    تأمين البيانات القديمة إذا كانت موجودة
  */

  const content = readJson(CONTENT_FILE, defaultContent());

  const defaults = defaultContent();

  if (!content.siteSettings) {
    content.siteSettings = defaults.siteSettings;
  }

  if (!content.home) {
    content.home = defaults.home;
  }

  if (!content.cards) {
    content.cards = defaults.cards;
  }

  if (!content.book) {
    content.book = defaults.book;
  }

  if (!Array.isArray(content.book.chapters)) {
    content.book.chapters = [];
  }

  if (!Array.isArray(content.poems)) {
    content.poems = [];
  }

  if (!Array.isArray(content.quotes)) {
    content.quotes = [];
  }

  if (!content.about) {
    content.about = defaults.about;
  }

  if (!content.contact) {
    content.contact = defaults.contact;
  }

  if (!content.contact.socialLinks) {
    content.contact.socialLinks =
      defaults.contact.socialLinks;
  }

  writeJson(CONTENT_FILE, content);

  const messages = readJson(
    MESSAGES_FILE,
    defaultMessages()
  );

  if (!Array.isArray(messages.messages)) {
    messages.messages = [];
  }

  messages.unreadCount =
    messages.messages.filter(
      message => message.read !== true
    ).length;

  writeJson(MESSAGES_FILE, messages);
}

/* =========================================================
   YOUTUBE
========================================================= */

function getYouTubeEmbedUrl(url) {
  if (!url) return "";

  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes("youtu.be")) {
      const id = parsed.pathname.replace("/", "").trim();

      if (!id) return "";

      return `https://www.youtube.com/embed/${id}`;
    }

    if (
      parsed.hostname.includes("youtube.com") ||
      parsed.hostname.includes("youtube-nocookie.com")
    ) {
      const id = parsed.searchParams.get("v");

      if (id) {
        return `https://www.youtube.com/embed/${id}`;
      }

      if (parsed.pathname.startsWith("/embed/")) {
        return `https://www.youtube.com${parsed.pathname}`;
      }

      if (parsed.pathname.startsWith("/shorts/")) {
        const id = parsed.pathname.split("/")[2];

        if (id) {
          return `https://www.youtube.com/embed/${id}`;
        }
      }
    }

    return "";
  } catch {
    return "";
  }
}

/* =========================================================
   AUTH
========================================================= */

function createSession() {
  const token = crypto.randomBytes(32).toString("hex");

  adminSessions.set(token, {
    createdAt: Date.now()
  });

  return token;
}

function isValidSession(token) {
  if (!token) return false;

  const session = adminSessions.get(token);

  if (!session) return false;

  if (
    Date.now() - session.createdAt >
    SESSION_DURATION
  ) {
    adminSessions.delete(token);
    return false;
  }

  return true;
}

function requireAdmin(req, res, next) {
  const authorization =
    req.headers.authorization || "";

  if (!authorization.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "غير مصرح. سجل الدخول أولًا."
    });
  }

  const token = authorization
    .replace("Bearer ", "")
    .trim();

  if (!isValidSession(token)) {
    return res.status(401).json({
      message: "انتهت جلسة الإدارة. سجل الدخول مرة أخرى."
    });
  }

  next();
}

/* =========================================================
   INITIALIZE
========================================================= */

ensureDataFiles();

/* =========================================================
   MAIN PAGE
========================================================= */

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "admin.html"));
});

app.get("/admin.html", (req, res) => {
  res.sendFile(path.join(__dirname, "admin.html"));
});

/* =========================================================
   CONTENT
========================================================= */

app.get("/api/content", (req, res) => {
  try {
    const content = readJson(
      CONTENT_FILE,
      defaultContent()
    );

    res.json(content);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "تعذر تحميل محتوى الموقع."
    });
  }
});

/* =========================================================
   ADMIN LOGIN
========================================================= */

app.post("/api/admin/login", (req, res) => {
  const { password } = req.body;

  if (!ADMIN_PASSWORD) {
    console.error(
      "ADMIN_PASSWORD is not configured in environment variables."
    );

    return res.status(500).json({
      message:
        "متغير ADMIN_PASSWORD غير موجود في إعدادات السيرفر."
    });
  }

  if (
    typeof password !== "string" ||
    password.length === 0
  ) {
    return res.status(400).json({
      message: "اكتب كلمة المرور."
    });
  }

  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({
      message: "كلمة المرور غير صحيحة."
    });
  }

  const token = createSession();

  res.json({
    success: true,
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
    const authorization =
      req.headers.authorization || "";

    const token = authorization
      .replace("Bearer ", "")
      .trim();

    adminSessions.delete(token);

    res.json({
      success: true,
      message: "تم تسجيل الخروج."
    });
  }
);

/* =========================================================
   ADMIN CHECK SESSION
========================================================= */

app.get(
  "/api/admin/session",
  requireAdmin,
  (req, res) => {
    res.json({
      authenticated: true
    });
  }
);

/* =========================================================
   GENERIC SECTION UPDATE
========================================================= */

app.post(
  "/api/admin/update-section",
  requireAdmin,
  (req, res) => {
    try {
      const { section, payload } = req.body;

      if (!section) {
        return res.status(400).json({
          message: "اسم القسم مطلوب."
        });
      }

      if (
        payload === null ||
        typeof payload !== "object"
      ) {
        return res.status(400).json({
          message: "بيانات القسم غير صحيحة."
        });
      }

      const content = readJson(
        CONTENT_FILE,
        defaultContent()
      );

      if (
        !Object.prototype.hasOwnProperty.call(
          content,
          section
        )
      ) {
        return res.status(404).json({
          message: "القسم غير موجود."
        });
      }

      if (
        typeof content[section] === "object" &&
        !Array.isArray(content[section])
      ) {
        content[section] = {
          ...content[section],
          ...payload
        };
      } else {
        content[section] = payload;
      }

      writeJson(CONTENT_FILE, content);

      res.json({
        success: true,
        message: "تم حفظ التعديلات بنجاح."
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "حدث خطأ أثناء حفظ التعديلات."
      });
    }
  }
);

/* =========================================================
   SITE SETTINGS
========================================================= */

app.post(
  "/api/admin/settings",
  requireAdmin,
  (req, res) => {
    try {
      const content = readJson(
        CONTENT_FILE,
        defaultContent()
      );

      content.siteSettings = {
        ...content.siteSettings,
        ...req.body
      };

      writeJson(CONTENT_FILE, content);

      res.json({
        success: true,
        message: "تم حفظ إعدادات الموقع."
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "تعذر حفظ إعدادات الموقع."
      });
    }
  }
);

/* =========================================================
   HOME
========================================================= */

app.post(
  "/api/admin/home",
  requireAdmin,
  (req, res) => {
    try {
      const content = readJson(
        CONTENT_FILE,
        defaultContent()
      );

      content.home = {
        ...content.home,
        ...req.body
      };

      writeJson(CONTENT_FILE, content);

      res.json({
        success: true,
        message:
          "تم حفظ إعدادات الصفحة الرئيسية."
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "تعذر حفظ الصفحة الرئيسية."
      });
    }
  }
);

/* =========================================================
   CARDS
========================================================= */

app.post(
  "/api/admin/cards",
  requireAdmin,
  (req, res) => {
    try {
      const { card, payload } = req.body;

      const allowedCards = [
        "book",
        "poems",
        "quotes"
      ];

      if (!allowedCards.includes(card)) {
        return res.status(400).json({
          message: "نوع البطاقة غير صحيح."
        });
      }

      const content = readJson(
        CONTENT_FILE,
        defaultContent()
      );

      content.cards[card] = {
        ...content.cards[card],
        ...payload
      };

      writeJson(CONTENT_FILE, content);

      res.json({
        success: true,
        message: "تم حفظ البطاقة."
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "تعذر حفظ البطاقة."
      });
    }
  }
);

/* =========================================================
   BOOK
========================================================= */

app.post(
  "/api/admin/book",
  requireAdmin,
  (req, res) => {
    try {
      const content = readJson(
        CONTENT_FILE,
        defaultContent()
      );

      const bookData = {
        ...req.body
      };

      if (bookData.youtubeUrl) {
        bookData.youtubeEmbedUrl =
          getYouTubeEmbedUrl(
            bookData.youtubeUrl
          );
      } else {
        bookData.youtubeEmbedUrl = "";
      }

      content.book = {
        ...content.book,
        ...bookData
      };

      if (!Array.isArray(content.book.chapters)) {
        content.book.chapters = [];
      }

      writeJson(CONTENT_FILE, content);

      res.json({
        success: true,
        message: "تم حفظ بيانات الكتاب."
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "تعذر حفظ بيانات الكتاب."
      });
    }
  }
);

/* =========================================================
   BOOK CHAPTERS - GET
========================================================= */

app.get(
  "/api/admin/book/chapters",
  requireAdmin,
  (req, res) => {
    const content = readJson(
      CONTENT_FILE,
      defaultContent()
    );

    res.json({
      chapters: content.book?.chapters || []
    });
  }
);

/* =========================================================
   BOOK CHAPTERS - ADD / UPDATE
========================================================= */

app.post(
  "/api/admin/book/chapters",
  requireAdmin,
  (req, res) => {
    try {
      const {
        id,
        title,
        number,
        content: chapterContent,
        fontFamily,
        fontSize,
        textColor,
        youtubeUrl
      } = req.body;

      if (!title || !chapterContent) {
        return res.status(400).json({
          message:
            "عنوان الفصل ونص الفصل مطلوبان."
        });
      }

      const db = readJson(
        CONTENT_FILE,
        defaultContent()
      );

      if (!Array.isArray(db.book.chapters)) {
        db.book.chapters = [];
      }

      const chapter = {
        title,
        number:
          number !== undefined &&
          number !== null &&
          number !== ""
            ? Number(number)
            : db.book.chapters.length + 1,

        content: chapterContent,

        fontFamily:
          fontFamily || "Amiri",

        fontSize:
          fontSize || "20px",

        textColor:
          textColor || "#1C1917",

        youtubeUrl:
          youtubeUrl || "",

        youtubeEmbedUrl:
          getYouTubeEmbedUrl(
            youtubeUrl || ""
          )
      };

      if (id) {
        const index =
          db.book.chapters.findIndex(
            chapter => chapter.id === id
          );

        if (index === -1) {
          return res.status(404).json({
            message: "الفصل غير موجود."
          });
        }

        db.book.chapters[index] = {
          ...db.book.chapters[index],
          ...chapter,
          id
        };
      } else {
        db.book.chapters.unshift({
          id: generateId(),
          ...chapter
        });
      }

      writeJson(CONTENT_FILE, db);

      res.json({
        success: true,
        message: "تم حفظ الفصل بنجاح.",
        chapters: db.book.chapters
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "حدث خطأ أثناء حفظ الفصل."
      });
    }
  }
);

/* =========================================================
   BOOK CHAPTER DELETE
========================================================= */

app.delete(
  "/api/admin/book/chapters/:id",
  requireAdmin,
  (req, res) => {
    try {
      const db = readJson(
        CONTENT_FILE,
        defaultContent()
      );

      const oldLength =
        db.book.chapters.length;

      db.book.chapters =
        db.book.chapters.filter(
          chapter =>
            chapter.id !== req.params.id
        );

      if (
        db.book.chapters.length === oldLength
      ) {
        return res.status(404).json({
          message: "الفصل غير موجود."
        });
      }

      writeJson(CONTENT_FILE, db);

      res.json({
        success: true,
        message: "تم حذف الفصل."
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "تعذر حذف الفصل."
      });
    }
  }
);

/* =========================================================
   POEMS - GET
========================================================= */

app.get(
  "/api/admin/poems",
  requireAdmin,
  (req, res) => {
    const db = readJson(
      CONTENT_FILE,
      defaultContent()
    );

    res.json({
      poems: db.poems || []
    });
  }
);

/* =========================================================
   POEMS - ADD / UPDATE
========================================================= */

app.post(
  "/api/admin/poems",
  requireAdmin,
  (req, res) => {
    try {
      const {
        id,
        title,
        type,
        motivation,
        content,
        fontFamily,
        fontSize,
        textColor,
        titleColor,
        lineHeight,
        textAlign
      } = req.body;

      if (!title || !content) {
        return res.status(400).json({
          message:
            "اسم القصيدة ونص القصيدة مطلوبان."
        });
      }

      const db = readJson(
        CONTENT_FILE,
        defaultContent()
      );

      if (!Array.isArray(db.poems)) {
        db.poems = [];
      }

      const poem = {
        title,
        type:
          type === "حر"
            ? "حر"
            : "عمودي",

        motivation:
          motivation || "",

        content,

        fontFamily:
          f
