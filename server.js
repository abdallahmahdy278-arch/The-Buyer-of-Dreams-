const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();

const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const DATA_DIR = path.join(__dirname, "data");
const CONTENT_FILE = path.join(DATA_DIR, "content.json");
const MESSAGES_FILE = path.join(DATA_DIR, "messages.json");

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
app.use(express.static(__dirname));

/*
|--------------------------------------------------------------------------
| Admin Sessions
|--------------------------------------------------------------------------
*/

const adminSessions = new Map();

function generateId() {
  return crypto.randomBytes(12).toString("hex");
}

function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

/*
|--------------------------------------------------------------------------
| Default Content
|--------------------------------------------------------------------------
*/

function getDefaultContent() {
  return {
    settings: {
      siteTitle: "بائعة الأحلام",
      siteDescription: "موقع أدبي شخصي يضم الكتاب والقصائد والمقتطفات.",
      footerText: "© بائعة الأحلام — جميع الحقوق محفوظة."
    },

    home: {
      mainQuote:
        "أنا لا أكتب لأُقال إنني كتبت، بل أكتب لأن في القلب كلامًا إن لم يخرج اختنق.",

      introText:
        "هذا فضاء أدبي شخصي يضم الكتاب والقصائد والمقتطفات وملامح السيرة.",

      heroImage:
        "https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=1200&auto=format&fit=crop",

      featuredExcerpt:
        "في بعض الأرواح نافذةٌ صغيرة، تطل منها القصيدة كلما أغلقت الحياة أبوابها.",

      style: {
        quoteFont: "Amiri",
        quoteSize: "28",
        quoteColor: "#8B0000",
        introFont: "Tajawal",
        introSize: "18",
        introColor: "#78716C"
      }
    },

    cards: {
      book: {
        title: "كتاب بائعة الأحلام",
        description:
          "كتاب أدبي ينسج الحلم من خيوط الحنين، ويعيد ترتيب الذاكرة بلغة شاعرية دافئة.",

        icon: "📖",

        style: {
          titleFont: "Aref Ruqaa",
          titleSize: "28",
          titleColor: "#8B0000",
          textFont: "Tajawal",
          textSize: "17",
          textColor: "#78716C"
        }
      },

      poems: {
        title: "القصائد",
        description: "مجموعة من القصائد التي كُتبت في أوقات مختلفة من الرحلة الأدبية.",
        icon: "✒️",

        style: {
          titleFont: "Aref Ruqaa",
          titleSize: "28",
          titleColor: "#8B0000",
          textFont: "Tajawal",
          textSize: "17",
          textColor: "#78716C"
        }
      },

      quotes: {
        title: "مقتطفات شعرية",
        description: "أبيات وعبارات قصيرة بقيت من القصائد والذاكرة.",
        icon: "📝",

        style: {
          titleFont: "Aref Ruqaa",
          titleSize: "28",
          titleColor: "#8B0000",
          textFont: "Tajawal",
          textSize: "17",
          textColor: "#78716C"
        }
      }
    },

    book: {
      title: "بائعة الأحلام",

      shortDescription:
        "كتاب أدبي ينسج الحلم من خيوط الحنين، ويحاول أن يعيد للذاكرة أصواتًا ظننا أنها غابت.",

      coverImage:
        "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=900&auto=format&fit=crop",

      printLink: "",
      pdfLink: "",

      youtubeUrl: "",

      style: {
        titleFont: "Aref Ruqaa",
        titleSize: "34",
        titleColor: "#8B0000",

        textFont: "Amiri",
        textSize: "21",
        textColor: "#2a2521",

        chapterTitleFont: "Aref Ruqaa",
        chapterTitleSize: "28",
        chapterTitleColor: "#8B0000"
      },

      chapters: []
    },

    poems: [],

    quotes: [],

    about: {
      title: "عن الكاتب",

      bio:
        "كاتب وشاعر عربي، يكتب من جهة القلب، ويؤمن أن الكلمات ليست زينةً للمعنى، بل بيتٌ يسكنه الشعور.",

      style: {
        titleFont: "Aref Ruqaa",
        titleSize: "34",
        titleColor: "#8B0000",

        textFont: "Tajawal",
        textSize: "19",
        textColor: "#78716C"
      }
    },

    contact: {
      title: "أرسل الرسالة لمشتري الأحلام",

      description:
        "اكتب ما تريد، وستصل رسالتك إلى مشتري الأحلام دون إظهار هويتك.",

      buttonText: "إرسال الرسالة",

      successMessage: "تم إرسال رسالتك بنجاح.",

      style: {
        titleFont: "Aref Ruqaa",
        titleSize: "34",
        titleColor: "#8B0000",

        textFont: "Tajawal",
        textSize: "18",
        textColor: "#78716C"
      }
    },

    social: {
      facebook: "",
      instagram: "",
      youtube: ""
    }
  };
}

/*
|--------------------------------------------------------------------------
| Default Messages
|--------------------------------------------------------------------------
*/

function getDefaultMessages() {
  return {
    messages: [],
    notifications: {
      unreadMessages: 0
    }
  };
}

/*
|--------------------------------------------------------------------------
| File Helpers
|--------------------------------------------------------------------------
*/

function ensureDataFiles() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(CONTENT_FILE)) {
    fs.writeFileSync(
      CONTENT_FILE,
      JSON.stringify(getDefaultContent(), null, 2),
      "utf8"
    );
  }

  if (!fs.existsSync(MESSAGES_FILE)) {
    fs.writeFileSync(
      MESSAGES_FILE,
      JSON.stringify(getDefaultMessages(), null, 2),
      "utf8"
    );
  }
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    console.error("JSON read error:", error);
    throw new Error("تعذر قراءة البيانات");
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(
    filePath,
    JSON.stringify(data, null, 2),
    "utf8"
  );
}

ensureDataFiles();

/*
|--------------------------------------------------------------------------
| YouTube
|--------------------------------------------------------------------------
*/

function getYouTubeEmbedUrl(url) {
  if (!url) return "";

  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes("youtu.be")) {
      const id = parsed.pathname.replace("/", "").trim();

      return id
        ? `https://www.youtube.com/embed/${id}`
        : "";
    }

    if (parsed.hostname.includes("youtube.com")) {
      if (parsed.pathname.includes("/embed/")) {
        return url;
      }

      if (parsed.pathname.includes("/shorts/")) {
        const id = parsed.pathname.split("/shorts/")[1]?.split("/")[0];

        return id
          ? `https://www.youtube.com/embed/${id}`
          : "";
      }

      const id = parsed.searchParams.get("v");

      return id
        ? `https://www.youtube.com/embed/${id}`
        : "";
    }

    return "";
  } catch {
    return "";
  }
}

/*
|--------------------------------------------------------------------------
| Admin Authentication
|--------------------------------------------------------------------------
*/

function requireAdmin(req, res, next) {
  const auth = req.headers.authorization || "";

  if (!auth.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "غير مصرح"
    });
  }

  const token = auth.replace("Bearer ", "").trim();

  if (!token || !adminSessions.has(token)) {
    return res.status(401).json({
      message: "جلسة الإدارة غير صالحة أو منتهية"
    });
  }

  next();
}

/*
|--------------------------------------------------------------------------
| Pages
|--------------------------------------------------------------------------
*/

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "admin.html"));
});

app.get("/admin.html", (req, res) => {
  res.sendFile(path.join(__dirname, "admin.html"));
});

/*
|--------------------------------------------------------------------------
| Public Content
|--------------------------------------------------------------------------
*/

app.get("/api/content", (req, res) => {
  try {
    const content = readJson(CONTENT_FILE);

    res.json(content);
  } catch {
    res.status(500).json({
      message: "تعذر تحميل محتوى الموقع"
    });
  }
});

/*
|--------------------------------------------------------------------------
| Contact
|--------------------------------------------------------------------------
*/

app.post("/api/contact", (req, res) => {
  const { message } = req.body;

  if (!message || !String(message).trim()) {
    return res.status(400).json({
      message: "الرسالة مطلوبة"
    });
  }

  const data = readJson(MESSAGES_FILE);

  const newMessage = {
    id: generateId(),

    /*
     * لا يتم تخزين اسم أو بريد إلكتروني.
     * الرسالة مجهولة الهوية بالكامل.
     */

    message: String(message).trim(),

    createdAt: new Date().toISOString(),

    read: false
  };

  data.messages.unshift(newMessage);

  if (!data.notifications) {
    data.notifications = {
      unreadMessages: 0
    };
  }

  data.notifications.unreadMessages =
    data.messages.filter(item => !item.read).length;

  writeJson(MESSAGES_FILE, data);

  res.json({
    message: "تم إرسال رسالتك بنجاح."
  });
});

/*
|--------------------------------------------------------------------------
| Admin Login
|--------------------------------------------------------------------------
*/

app.post("/api/admin/login", (req, res) => {
  const { password } = req.body;

  if (!ADMIN_PASSWORD) {
    return res.status(500).json({
      message:
        "متغير ADMIN_PASSWORD غير موجود في إعدادات الخادم."
    });
  }

  if (
    typeof password !== "string" ||
    password !== ADMIN_PASSWORD
  ) {
    return res.status(401).json({
      message: "كلمة المرور غير صحيحة"
    });
  }

  const token = generateToken();

  adminSessions.set(token, {
    createdAt: Date.now()
  });

  res.json({
    message: "تم تسجيل الدخول بنجاح",
    token
  });
});

/*
|--------------------------------------------------------------------------
| Admin Logout
|--------------------------------------------------------------------------
*/

app.post("/api/admin/logout", requireAdmin, (req, res) => {
  const auth = req.headers.authorization || "";
  const token = auth.replace("Bearer ", "").trim();

  adminSessions.delete(token);

  res.json({
    message: "تم تسجيل الخروج"
  });
});

/*
|--------------------------------------------------------------------------
| Admin - Messages
|--------------------------------------------------------------------------
*/

app.get(
  "/api/admin/messages",
  requireAdmin,
  (req, res) => {
    try {
      const data = readJson(MESSAGES_FILE);

      res.json(data);
    } catch {
      res.status(500).json({
        message: "تعذر تحميل الرسائل"
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| Mark Message As Read
|--------------------------------------------------------------------------
*/

app.post(
  "/api/admin/messages/:id/read",
  requireAdmin,
  (req, res) => {
    const data = readJson(MESSAGES_FILE);

    const message = data.messages.find(
      item => item.id === req.params.id
    );

    if (!message) {
      return res.status(404).json({
        message: "الرسالة غير موجودة"
      });
    }

    message.read = true;

    data.notifications.unreadMessages =
      data.messages.filter(item => !item.read).length;

    writeJson(MESSAGES_FILE, data);

    res.json({
      message: "تم تعليم الرسالة كمقروءة"
    });
  }
);

/*
|--------------------------------------------------------------------------
| Delete Message
|--------------------------------------------------------------------------
*/

app.delete(
  "/api/admin/messages/:id",
  requireAdmin,
  (req, res) => {
    const data = readJson(MESSAGES_FILE);

    data.messages = data.messages.filter(
      item => item.id !== req.params.id
    );

    data.notifications.unreadMessages =
      data.messages.filter(item => !item.read).length;

    writeJson(MESSAGES_FILE, data);

    res.json({
      message: "تم حذف الرسالة"
    });
  }
);

/*
|--------------------------------------------------------------------------
| Update Any Content Section
|--------------------------------------------------------------------------
*/

app.post(
  "/api/admin/update-section",
  requireAdmin,
  (req, res) => {
    const { section, payload } = req.body;

    if (!section || !payload || typeof payload !== "object") {
      return res.status(400).json({
        message: "بيانات غير صحيحة"
      });
    }

    const content = readJson(CONTENT_FILE);

    if (
      !Object.prototype.hasOwnProperty.call(
        content,
        section
      )
    ) {
      return res.status(404).json({
        message: "القسم غير موجود"
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
      message: "تم حفظ التعديلات"
    });
  }
);

/*
|--------------------------------------------------------------------------
| Update Cards
|--------------------------------------------------------------------------
*/

app.post(
  "/api/admin/cards/:card",
  requireAdmin,
  (req, res) => {
    const { card } = req.params;

    const allowed = [
      "book",
      "poems",
      "quotes"
    ];

    if (!allowed.includes(card)) {
      return res.status(400).json({
        message: "البطاقة غير صحيحة"
      });
    }

    const content = readJson(CONTENT_FILE);

    content.cards[card] = {
      ...content.cards[card],
      ...req.body
    };

    writeJson(CONTENT_FILE, content);

    res.json({
      message: "تم حفظ البطاقة"
    });
  }
);

/*
|--------------------------------------------------------------------------
| Book Chapters
|--------------------------------------------------------------------------
*/

app.post(
  "/api/admin/book/chapters",
  requireAdmin,
  (req, res) => {
    const {
      id,
      title,
      content: chapterContent,
      youtubeUrl
    } = req.body;

    if (!title || !chapterContent) {
      return res.status(400).json({
        message: "عنوان الفصل والنص مطلوبان"
      });
    }

    const db = readJson(CONTENT_FILE);

    if (!Array.isArray(db.book.chapters)) {
      db.book.chapters = [];
    }

    const chapter = {
      title: String(title).trim(),

      content: String(chapterContent),

      youtubeUrl: youtubeUrl
        ? String(youtubeUrl).trim()
        : "",

      embedUrl: getYouTubeEmbedUrl(youtubeUrl),

      updatedAt: new Date().toISOString()
    };

    if (id) {
      const index = db.book.chapters.findIndex(
        item => item.id === id
      );

      if (index === -1) {
        return res.status(404).json({
          message: "الفصل غير موجود"
        });
      }

      db.book.chapters[index] = {
        ...db.book.chapters[index],
        ...chapter
      };
    } else {
      db.book.chapters.push({
        id: generateId(),
        ...chapter
      });
    }

    writeJson(CONTENT_FILE, db);

    res.json({
      message: "تم حفظ الفصل بنجاح"
    });
  }
);

/*
|--------------------------------------------------------------------------
| Delete Chapter
|--------------------------------------------------------------------------
*/

app.delete(
  "/api/admin/book/chapters/:id",
  requireAdmin,
  (req, res) => {
    const db = readJson(CONTENT_FILE);

    db.book.chapters = (
      db.book.chapters || []
    ).filter(
      chapter => chapter.id !== req.params.id
    );

    writeJson(CONTENT_FILE, db);

    res.json({
      message: "تم حذف الفصل"
    });
  }
);

/*
|--------------------------------------------------------------------------
| Reorder Chapters
|--------------------------------------------------------------------------
*/

app.post(
  "/api/admin/book/chapters/reorder",
  requireAdmin,
  (req, res) => {
    const { ids } = req.body;

    if (!Array.isArray(ids)) {
      return res.status(400).json({
        message: "ترتيب غير صحيح"
      });
    }

    const db = readJson(CONTENT_FILE);

    const chapters = db.book.chapters || [];

    const reordered = ids
      .map(id =>
        chapters.find(chapter => chapter.id === id)
      )
      .filter(Boolean);

    db.book.chapters = reordered;

    writeJson(CONTENT_FILE, db);

    res.json({
      message: "تم حفظ ترتيب الفصول"
    });
  }
);

/*
|--------------------------------------------------------------------------
| Poems
|--------------------------------------------------------------------------
*/

app.post(
  "/api/admin/poems",
  requireAdmin,
  (req, res) => {
    const {
      id,
      title,
      type,
      reason,
      content: poemContent,
      font,
      fontSize,
      color
    } = req.body;

    if (!title || !poemContent) {
      return res.status(400).json({
        message: "اسم القصيدة والنص مطلوبان"
      });
    }

    const db = readJson(CONTENT_FILE);

    if (!Array.isArray(db.poems)) {
      db.poems = [];
    }

    const poem = {
      title: String(title).trim(),

      type:
        type === "عمودي"
          ? "عمودي"
          : "حر",

      reason: reason
        ? String(reason)
        : "",

      content: String(poemContent),

      style: {
        font: font || "Amiri",
        fontSize: fontSize || "24",
        color: color || "#2a2521"
      },

      updatedAt: new Date().toISOString()
    };

    if (id) {
      const index = db.poems.findIndex(
        poem => poem.id === id
      );

      if (index === -1) {
        return res.status(404).json({
          message: "القصيدة غير موجودة"
        });
      }

      db.poems[index] = {
        ...db.poems[index],
        ...poem
      };
    } else {
      db.poems.unshift({
        id: generateId(),
        ...poem
      });
    }

    writeJson(CONTENT_FILE, db);

    res.json({
      message: "تم حفظ القصيدة بنجاح"
    });
  }
);

/*
|--------------------------------------------------------------------------
| Delete Poem
|--------------------------------------------------------------------------
*/

app.delete(
  "/api/admin/poems/:id",
  requireAdmin,
  (req, res) => {
    const db = readJson(CONTENT_FILE);

    db.poems = (
      db.poems || []
    ).filter(
      poem => poem.id !== req.params.id
    );

    writeJson(CONTENT_FILE, db);

    res.json({
      message: "تم حذف القصيدة"
    });
  }
);

/*
|--------------------------------------------------------------------------
| Quotes
|--------------------------------------------------------------------------
*/

app.post(
  "/api/admin/quotes",
  requireAdmin,
  (req, res) => {
    const {
      id,
      title,
      text,
      font,
      fontSize,
      color
    } = req.body;

    if (!text) {
      return res.status(400).json({
        message: "نص المقتطف مطلوب"
      });
    }

    const db = readJson(CONTENT_FILE);

    if (!Array.isArray(db.quotes)) {
      db.quotes = [];
    }

    const quote = {
      title: title || "مقتطف شعري",

      text: String(text),

      style: {
        font: font || "Amiri",
        fontSize: fontSize || "24",
        color: color || "#2a2521"
      },

      updatedAt: new Date().toISOString()
    };

    if (id) {
      const index = db.quotes.findIndex(
        quote => quote.id === id
      );

      if (index === -1) {
        return res.status(404).json({
          message: "المقتطف غير موجود"
        });
      }

      db.quotes[index] = {
        ...db.quotes[index],
        ...quote
      };
    } else {
      db.quotes.unshift({
        id: generateId(),
        ...quote
      });
    }

    writeJson(CONTENT_FILE, db);

    res.json({
      message: "تم حفظ المقتطف"
    }
