const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "123456";

const DATA_DIR = path.join(__dirname, "data");
const CONTENT_FILE = path.join(DATA_DIR, "content.json");
const MESSAGES_FILE = path.join(DATA_DIR, "messages.json");

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

const adminSessions = new Set();

function ensureDataFiles() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(CONTENT_FILE)) {
    const defaultContent = {
      home: {
        mainQuote: "أنا لا أكتب لأُقال إنني كتبت، بل أكتب لأن في القلب كلامًا إن لم يخرج اختنق.",
        introText: "هذا فضاء أدبي شخصي يضم القصائد والمقتطفات وملامح السيرة والكتاب.",
        heroImage: "https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=1200&auto=format&fit=crop",
        featuredExcerpt: "في بعض الأرواح نافذةٌ صغيرة، تطل منها القصيدة كلما أغلقت الحياة أبوابها."
      },
      book: {
        title: "بائعة الأحلام",
        coverImage: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=900&auto=format&fit=crop",
        description: "كتاب أدبي ينسج الحلم من خيوط الحنين، ويعيد ترتيب الذاكرة بلغة شاعرية دافئة.",
        printLink: "#",
        pdfLink: ""
      },
      poems: [
        {
          id: generateId(),
          title: "على باب الحنين",
          category: "عمودي",
          collectionNumber: "1",
          font: "Amiri",
          firstVerse: "وقفتُ على بابِ الحنينِ مؤرقًا\nأعدُّ خطايَ إذا تناثرَ موعدي",
          content: "وقفتُ على بابِ الحنينِ مؤرقًا\nأعدُّ خطايَ إذا تناثرَ موعدي\nوأجمعُ من ضوءِ المساءِ حكايةً\nتقولُ: سيأتي الحلمُ رغم التبددِ"
        },
        {
          id: generateId(),
          title: "مدينة تشبه الغياب",
          category: "حر",
          collectionNumber: "2",
          font: "Reem Kufi",
          firstVerse: "في المدينة التي تشبه الغياب، كان قلبي يتعلم كيف يصير نافذة.",
          content: "في المدينة التي تشبه الغياب،\nكان قلبي يتعلم كيف يصير نافذة،\nوكيف يخبئ المطر في جيبه\nدون أن يبتل أحد."
        }
      ],
      quotes: [
        {
          id: generateId(),
          title: "مقتطف 1",
          text: "ليت بعض الأحلام لا تُفسَّر… يكفيها أن تُحس."
        },
        {
          id: generateId(),
          title: "مقتطف 2",
          text: "كل قصيدة نجت من الصمت، كانت في الأصل نجدة."
        }
      ],
      about: {
        bio: "كاتب وشاعر عربي، يكتب من جهة القلب، ويؤمن أن الكلمات ليست زينةً للمعنى، بل بيتٌ يسكنه الشعور. في هذا الموقع تتجاور القصائد والمقتطفات والكتاب والسيرة في مساحة واحدة هادئة."
      },
      media: [
        {
          id: generateId(),
          title: "صورة أدبية",
          type: "image",
          url: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=1200&auto=format&fit=crop"
        }
      ],
      contact: {
        socials: {
          facebook: "",
          instagram: "",
          youtube: "",
          x: ""
        }
      }
    };

    fs.writeFileSync(CONTENT_FILE, JSON.stringify(defaultContent, null, 2), "utf8");
  }

  if (!fs.existsSync(MESSAGES_FILE)) {
    const defaultMessages = {
      messages: [],
      newsletter: []
    };
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(defaultMessages, null, 2), "utf8");
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

function generateId() {
  return crypto.randomBytes(8).toString("hex");
}

function getYouTubeEmbedUrl(url) {
  if (!url) return "";

  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes("youtu.be")) {
      const id = parsed.pathname.replace("/", "");
      return id ? `https://www.youtube.com/embed/${id}` : "";
    }

    if (parsed.hostname.includes("youtube.com")) {
      const id = parsed.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : "";
    }

    return "";
  } catch {
    return "";
  }
}

function requireAdmin(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.replace("Bearer ", "").trim();

  if (!token || !adminSessions.has(token)) {
    return res.status(401).json({ message: "غير مصرح" });
  }

  next();
}

ensureDataFiles();

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/api/content", (req, res) => {
  const content = readJson(CONTENT_FILE);
  res.json(content);
});

app.post("/api/contact", (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ message: "كل الحقول مطلوبة" });
  }

  const data = readJson(MESSAGES_FILE);
  data.messages.unshift({
    id: generateId(),
    name,
    email,
    message,
    createdAt: new Date().toISOString()
  });

  writeJson(MESSAGES_FILE, data);
  res.json({ message: "تم إرسال رسالتك بنجاح" });
});

app.post("/api/newsletter", (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "البريد الإلكتروني مطلوب" });
  }

  const data = readJson(MESSAGES_FILE);

  const exists = data.newsletter.some(item => item.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    return res.json({ message: "هذا البريد مشترك بالفعل" });
  }

  data.newsletter.unshift({
    id: generateId(),
    email,
    createdAt: new Date().toISOString()
  });

  writeJson(MESSAGES_FILE, data);
  res.json({ message: "تم الاشتراك في النشرة البريدية" });
});

app.post("/api/admin/login", (req, res) => {
  const { password } = req.body;

  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ message: "كلمة المرور غير صحيحة" });
  }

  const token = crypto.randomBytes(24).toString("hex");
  adminSessions.add(token);

  res.json({
    message: "تم تسجيل الدخول",
    token
  });
});

app.get("/api/admin/messages", requireAdmin, (req, res) => {
  const data = readJson(MESSAGES_FILE);
  res.json(data);
});

app.post("/api/admin/update-section", requireAdmin, (req, res) => {
  const { section, payload } = req.body;
  const content = readJson(CONTENT_FILE);

  if (!section || typeof payload !== "object") {
    return res.status(400).json({ message: "بيانات غير صحيحة" });
  }

  if (section === "contact") {
    content.contact = {
      ...content.contact,
      ...payload
    };
  } else {
    content[section] = {
      ...content[section],
      ...payload
    };
  }

  writeJson(CONTENT_FILE, content);
  res.json({ message: "تم حفظ التعديلات" });
});

app.post("/api/admin/poems", requireAdmin, (req, res) => {
  const { id, title, category, collectionNumber, font, firstVerse, content: poemContent } = req.body;
  const db = readJson(CONTENT_FILE);

  if (!title || !poemContent) {
    return res.status(400).json({ message: "العنوان والنص الكامل مطلوبان" });
  }

  if (id) {
    const index = db.poems.findIndex(p => p.id === id);
    if (index === -1) {
      return res.status(404).json({ message: "القصيدة غير موجودة" });
    }

    db.poems[index] = {
      ...db.poems[index],
      title,
      category,
      collectionNumber,
      font,
      firstVerse,
      content: poemContent
    };
  } else {
    db.poems.unshift({
      id: generateId(),
      title,
      category,
      collectionNumber,
      font,
      firstVerse,
      content: poemContent
    });
  }

  writeJson(CONTENT_FILE, db);
  res.json({ message: "تم حفظ القصيدة بنجاح" });
});

app.delete("/api/admin/poems/:id", requireAdmin, (req, res) => {
  const db = readJson(CONTENT_FILE);
  db.poems = db.poems.filter(p => p.id !== req.params.id);
  writeJson(CONTENT_FILE, db);
  res.json({ message: "تم حذف القصيدة" });
});

app.post("/api/admin/quotes", requireAdmin, (req, res) => {
  const { id, title, text } = req.body;
  const db = readJson(CONTENT_FILE);

  if (!text) {
    return res.status(400).json({ message: "نص المقتطف مطلوب" });
  }

  if (id) {
    const index = db.quotes.findIndex(q => q.id === id);
    if (index === -1) {
      return res.status(404).json({ message: "المقتطف غير موجود" });
    }

    db.quotes[index] = {
      ...db.quotes[index],
      title,
      text
    };
  } else {
    db.quotes.unshift({
      id: generateId(),
      title,
      text
    });
  }

  writeJson(CONTENT_FILE, db);
  res.json({ message: "تم حفظ المقتطف" });
});

app.delete("/api/admin/quotes/:id", requireAdmin, (req, res) => {
  const db = readJson(CONTENT_FILE);
  db.quotes = db.quotes.filter(q => q.id !== req.params.id);
  writeJson(CONTENT_FILE, db);
  res.json({ message: "تم حذف المقتطف" });
});

app.post("/api/admin/media", requireAdmin, (req, res) => {
  const { id, title, type, url } = req.body;
  const db = readJson(CONTENT_FILE);

  if (!type || !url) {
    return res.status(400).json({ message: "النوع والرابط مطلوبان" });
  }

  const mediaItem = {
    title,
    type,
    url
  };

  if (type === "youtube") {
    mediaItem.embedUrl = getYouTubeEmbedUrl(url);
  }

  if (id) {
    const index = db.media.findIndex(m => m.id === id);
    if (index === -1) {
      return res.status(404).json({ message: "العنصر غير موجود" });
    }

    db.media[index] = {
      ...db.media[index],
      ...mediaItem
    };
  } else {
    db.media.unshift({
      id: generateId(),
      ...mediaItem
    });
  }

  writeJson(CONTENT_FILE, db);
  res.json({ message: "تم حفظ الوسيط" });
});

app.delete("/api/admin/media/:id", requireAdmin, (req, res) => {
  const db = readJson(CONTENT_FILE);
  db.media = db.media.filter(m => m.id !== req.params.id);
  writeJson(CONTENT_FILE, db);
  res.json({ message: "تم حذف الوسيط" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
        
