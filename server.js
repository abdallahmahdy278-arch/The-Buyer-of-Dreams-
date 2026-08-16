/**
 * بائعة الأحلام — الخادم الرئيسي
 * Express + ملفات JSON كقاعدة بيانات + حماية لوحة التحكم بكلمة مرور من متغير البيئة ADMIN_PASSWORD
 */
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const CONTENT_FILE = path.join(DATA_DIR, 'content.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const PORT = process.env.PORT || 3000;

/* ------------------------------------------------------------------ */
/* المحتوى الافتراضي (يُنشأ تلقائيًا عند أول تشغيل)                    */
/* ------------------------------------------------------------------ */
const DEFAULT_CONTENT = {
  site: {
    name: 'بائعة الأحلام',
    tagline: 'كلمات تُكتب لتبقى… وأحلام تُروى لتولد من جديد.'
  },
  hero: {
    quote: {
      text: 'هنا يسكن الحلم… وبين السطور تولد كلماتٌ لا تموت.',
      font: 'Amiri',
      fontSize: 26,
      color: '#8B1A1A',
      lineHeight: 2
    },
    imageUrl: ''
  },
  dailyExcerpt: {
    text: 'مقتطف اليوم… ضع هنا نصًا أدبيًا أو شعريًا قصيرًا يليق بيوم قارئك.',
    font: 'Scheherazade New',
    fontSize: 22,
    color: '#5C4033',
    lineHeight: 2
  },
  book: {
    title: 'كتاب بائعة الأحلام',
    blurb: {
      text: 'نبذة مختصرة عن الكتاب… سيرة الأحلام والكلمات، فصلٌ بعد فصل، حكايةٌ تنتظر من يقرؤها.',
      font: 'Tajawal',
      fontSize: 18,
      color: '#3E3A39',
      lineHeight: 1.9
    },
    defaultStyle: {
      font: 'Amiri',
      fontSize: 20,
      color: '#33302E',
      headingFont: 'Aref Ruqaa',
      headingSize: 28,
      headingColor: '#8B1A1A',
      lineHeight: 2.1
    },
    chapters: [
      {
        id: 'c1',
        title: 'الفصل الأول',
        content: 'هنا يبدأ الفصل الأول…\n\nاكتب نص الفصل كاملًا من لوحة التحكم، وسيُعرض للزائر بنفس التنسيق الذي تختاره، مع الحفاظ على فقراتك وأسطرك ومسافاتك كما هي.',
        youtubeUrl: '',
        style: {}
      }
    ]
  },
  poems: [
    {
      id: 'p1',
      title: 'القصيدة الأولى',
      type: 'vertical',
      reason: 'كتبت هذه القصيدة في… (ضع هنا سبب كتابة القصيدة أو ظروفها)',
      content: 'بيتُ الشعر الأول…\nوبيتُ الشعر الثاني…\nوبيتُ الشعر الثالث…',
      style: {
        font: 'Amiri',
        fontSize: 22,
        color: '#33302E',
        headingFont: 'Aref Ruqaa',
        headingSize: 30,
        headingColor: '#8B1A1A',
        lineHeight: 2.2
      }
    }
  ],
  excerpts: [
    {
      id: 'e1',
      title: 'خاطرة',
      text: 'نص المقتطف الشعري أو الخاطرة… يظهر هنا داخل بطاقة بيضاء أنيقة.',
      style: {
        font: 'Scheherazade New',
        fontSize: 20,
        color: '#4A4036',
        headingFont: 'Aref Ruqaa',
        headingSize: 26,
        headingColor: '#8B1A1A',
        lineHeight: 2
      }
    }
  ],
  about: {
    text: 'السيرة الذاتية الأدبية…\n\nاكتب هنا نبذة عنك وعن رحلتك مع الكلمة، ويمكن أن تكون طويلة ومتعددة الفقرات وسيتم عرضها محافظة على فقراتها وسطورها.',
    font: 'Tajawal',
    fontSize: 18,
    color: '#3E3A39',
    lineHeight: 2
  },
  social: {
    youtube: '',
    instagram: '',
    facebook: ''
  },
  theme: {
    primaryColor: '#8B1A1A',
    goldColor: '#C9A227',
    textColor: '#3E3A39',
    bgColor: '#FAF3E8',
    cardColor: '#FFFDF8',
    baseFont: 'Tajawal',
    headingFont: 'Aref Ruqaa',
    baseSize: 17,
    headingSize: 32
  }
};

/* ------------------------------------------------------------------ */
/* إدارة ملفات البيانات                                                */
/* ------------------------------------------------------------------ */
function ensureDataFiles() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(CONTENT_FILE)) writeJSON(CONTENT_FILE, DEFAULT_CONTENT);
  if (!fs.existsSync(MESSAGES_FILE)) writeJSON(MESSAGES_FILE, []);
}

function readJSON(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    return fallback;
  }
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

/* ------------------------------------------------------------------ */
/* المصادقة: رمز جلسة آمن بدلًا من كلمة المرور في الواجهة              */
/* ------------------------------------------------------------------ */
let tokens = new Set();
let attempts = {}; // حماية من التخمين المتكرر

function issueToken() {
  const t = crypto.randomBytes(32).toString('hex');
  tokens.add(t);
  return t;
}

function getCookies(req) {
  const c = req.headers.cookie || '';
  const out = {};
  c.split(';').forEach((p) => {
    const i = p.indexOf('=');
    if (i > -1) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}

function getToken(req) {
  const h = req.headers.authorization || '';
  if (h.startsWith('Bearer ')) return h.slice(7);
  return getCookies(req).admin_token || '';
}

function requireAdmin(req, res, next) {
  const token = getToken(req);
  if (token && tokens.has(token)) return next();
  return res.status(401).json({ error: 'غير مصرح — الرجاء تسجيل الدخول' });
}

/* ------------------------------------------------------------------ */
/* التطبيق                                                             */
/* ------------------------------------------------------------------ */
const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

/* تقديم صفحتي الموقع ولوحة التحكم فقط (لا يُكشف مجلد البيانات أبدًا) */
app.get('/', (req, res) => res.sendFile(path.join(ROOT, 'index.html')));
app.get('/index.html', (req, res) => res.sendFile(path.join(ROOT, 'index.html')));
app.get('/admin.html', (req, res) => res.sendFile(path.join(ROOT, 'admin.html')));

/* ------------------------------ المصادقة --------------------------- */
app.post('/api/login', (req, res) => {
  const ip = req.ip || 'unknown';
  const now = Date.now();
  const rec = attempts[ip] || { count: 0, first: now };
  if (rec.count >= 10 && now - rec.first < 10 * 60 * 1000) {
    return res.status(429).json({ error: 'محاولات كثيرة جدًا، حاول بعد قليل' });
  }
  const { password } = req.body || {};
  if (String(password) === ADMIN_PASSWORD) {
    delete attempts[ip];
    const token = issueToken();
    res.setHeader(
      'Set-Cookie',
      `admin_token=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${7 * 24 * 3600}`
    );
    return res.json({ ok: true });
  }
  rec.count += 1;
  rec.first = now;
  attempts[ip] = rec;
  return res.status(401).json({ error: 'كلمة المرور غير صحيحة' });
});

app.post('/api/logout', (req, res) => {
  tokens.delete(getToken(req));
  res.setHeader('Set-Cookie', 'admin_token=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0');
  return res.json({ ok: true });
});

app.get('/api/me', (req, res) => {
  const token = getToken(req);
  res.json({ authenticated: !!(token && tokens.has(token)) });
});

/* ------------------------------ المحتوى ---------------------------- */
app.get('/api/content', (req, res) => {
  res.json(readJSON(CONTENT_FILE, DEFAULT_CONTENT));
});

app.put('/api/content', requireAdmin, (req, res) => {
  const c = req.body;
  if (!c || typeof c !== 'object') return res.status(400).json({ error: 'بيانات غير صالحة' });
  writeJSON(CONTENT_FILE, c);
  res.json({ ok: true });
});

/* ------------------------------ الرسائل ---------------------------- */
app.get('/api/messages', requireAdmin, (req, res) => {
  const list = readJSON(MESSAGES_FILE, []);
  res.json({ messages: list, unread: list.filter((m) => !m.read).length });
});

app.post('/api/messages', (req, res) => {
  const { name, message } = req.body || {};
  if (!name || !String(name).trim() || !message || !String(message).trim()) {
    return res.status(400).json({ error: 'يرجى إدخال الاسم والرسالة' });
  }
  const list = readJSON(MESSAGES_FILE, []);
  list.unshift({
    id: crypto.randomBytes(8).toString('hex'),
    name: String(name).trim(),
    message: String(message).trim(),
    read: false,
    createdAt: new Date().toISOString()
  });
  writeJSON(MESSAGES_FILE, list);
  res.json({ ok: true });
});

app.patch('/api/messages/:id', requireAdmin, (req, res) => {
  const list = readJSON(MESSAGES_FILE, []);
  const item = list.find((m) => m.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'الرسالة غير موجودة' });
  item.read = true;
  writeJSON(MESSAGES_FILE, list);
  res.json({ ok: true });
});

app.delete('/api/messages/:id', requireAdmin, (req, res) => {
  let list = readJSON(MESSAGES_FILE, []);
  list = list.filter((m) => m.id !== req.params.id);
  writeJSON(MESSAGES_FILE, list);
  res.json({ ok: true });
});

/* ------------------------------ 404 و الأخطاء ---------------------- */
app.use('/api', (req, res) => res.status(404).json({ error: 'المسار غير موجود' }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'خطأ داخلي في الخادم' });
});

/* ------------------------------------------------------------------ */
ensureDataFiles();
app.listen(PORT, () => {
  console.log('بائعة الأحلام تعمل على المنفذ ' + PORT);
  console.log('الموقع:  http://localhost:' + PORT);
  console.log('لوحة التحكم: http://localhost:' + PORT + '/admin.html');
});
