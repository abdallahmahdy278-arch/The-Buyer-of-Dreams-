/**
 * بائعة الأحلام — الخادم الرئيسي (مربوط بـ Firebase Firestore)
 */
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// تهيئة Firebase Admin (تأكد من إعداد متغيرات البيئة أو ملف الـ Service Account)
initializeApp();
const db = getFirestore();

const ROOT = __dirname;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const PORT = process.env.PORT || 3000;

/* ------------------------------------------------------------------ */
/* المحتوى الافتراضي                                                   */
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
      content: '',
      lines: [
        { a: 'بيتُ الشعر الأول…', sep: '—', b: 'وبه يكتمل البيتُ الأول' },
        { a: 'بيتُ الشعر الثاني…', sep: '—', b: 'وبه يكتمل البيتُ الثاني' }
      ],
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
    facebook: '',
    tiktok: ''
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
/* دوال التعامل مع Firestore                                            */
/* ------------------------------------------------------------------ */
async function getContentFromDB() {
  const docRef = db.collection('settings').doc('content');
  const docSnap = await docRef.get();
  if (!docSnap.exists) {
    await docRef.set(DEFAULT_CONTENT);
    return DEFAULT_CONTENT;
  }
  return docSnap.data();
}

async function saveContentToDB(data) {
  const docRef = db.collection('settings').doc('content');
  await docRef.set(data);
}

async function getMessagesFromDB() {
  const snapshot = await db.collection('messages').orderBy('createdAt', 'desc').get();
  let messages = [];
  snapshot.forEach(doc => {
    messages.push({ id: doc.id, ...doc.data() });
  });
  return messages;
}

async function addMessageToDB(msgData) {
  await db.collection('messages').add(msgData);
}

async function updateMessageInDB(id, updateData) {
  await db.collection('messages').doc(id).update(updateData);
}

async function deleteMessageFromDB(id) {
  await db.collection('messages').doc(id).delete();
}

/* ------------------------------------------------------------------ */
/* المصادقة: رمز جلسة آمن                                             */
/* ------------------------------------------------------------------ */
let tokens = new Set();
let attempts = {};

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
app.get('/api/content', async (req, res) => {
  try {
    const content = await getContentFromDB();
    res.json(content);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'خطأ في جلب المحتوى' });
  }
});

app.put('/api/content', requireAdmin, async (req, res) => {
  const c = req.body;
  if (!c || typeof c !== 'object') return res.status(400).json({ error: 'بيانات غير صالحة' });
  try {
    await saveContentToDB(c);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'خطأ في حفظ المحتوى' });
  }
});

/* ------------------------------ الرسائل ---------------------------- */
app.get('/api/messages', requireAdmin, async (req, res) => {
  try {
    const list = await getMessagesFromDB();
    res.json({ messages: list, unread: list.filter((m) => !m.read).length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'خطأ في جلب الرسائل' });
  }
});

app.post('/api/messages', async (req, res) => {
  const { name, message } = req.body || {};
  if (!message || !String(message).trim()) {
    return res.status(400).json({ error: 'يرجى كتابة الرسالة أولًا' });
  }
  try {
    await addMessageToDB({
      name: (name && String(name).trim()) || 'زائر مجهول',
      message: String(message).trim(),
      read: false,
      createdAt: new Date().toISOString()
    });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'خطأ في إرسال الرسالة' });
  }
});

app.patch('/api/messages/:id', requireAdmin, async (req, res) => {
  try {
    await updateMessageInDB(req.params.id, { read: true });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'خطأ في تحديث الرسالة' });
  }
});

app.delete('/api/messages/:id', requireAdmin, async (req, res) => {
  try {
    await deleteMessageFromDB(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'خطأ في حذف الرسالة' });
  }
});

/* ------------------------------ 404 و الأخطاء ---------------------- */
app.use('/api', (req, res) => res.status(404).json({ error: 'المسار غير موجود' }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'خطأ داخلي في الخادم' });
});

/* ------------------------------------------------------------------ */
app.listen(PORT, () => {
  console.log('بائعة الأحلام تعمل على المنفذ ' + PORT);
  console.log('الموقع:  http://localhost:' + PORT);
  console.log('لوحة التحكم: http://localhost:' + PORT + '/admin.html');
});
