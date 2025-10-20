// ✅ استيراد المكتبات المطلوبة
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// ✅ تهيئة التطبيق
const app = express();
const PORT = 3000;
const JWT_SECRET = 'very-secret-key-change-me';

// ✅ مسار تخزين البيانات في ملف JSON
const DATA_PATH = path.join(__dirname, 'data.json');

// ✅ إعدادات Express
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ دوال المساعدة لقراءة وكتابة قاعدة البيانات
function readDB() {
  try {
    return JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
  } catch {
    return { users: [], certificates: [] };
  }
}

function writeDB(db) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(db, null, 2), 'utf-8');
}

// ✅ التحقق من التوكن (JWT Authentication)
function requireAuth(req, res, next) {
  const a = req.headers.authorization || '';
  const t = a.startsWith('Bearer ') ? a.slice(7) : null;

  if (!t) return res.status(401).json({ error: 'لا يوجد رمز دخول' });

  try {
    req.user = jwt.verify(t, JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: 'رمز غير صالح' });
  }
}

// ✅ تسجيل الدخول
app.post('/api/login', (req, res) => {
  const { email, password } = req.body || {};
  const db = readDB();

  const u = db.users.find(x => x.email === email && x.password === password);
  if (!u) return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });

  const token = jwt.sign(
    { email: u.email, role: u.role, name: u.name },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({
    token,
    profile: { email: u.email, role: u.role, name: u.name }
  });
});

// ✅ إرجاع قائمة الشهادات
app.get('/api/certificates', requireAuth, (req, res) => {
  res.json(readDB().certificates);
});

// ✅ إضافة شهادة جديدة
app.post('/api/certificates', requireAuth, (req, res) => {
  const { studentName, title, issueDate } = req.body || {};

  if (!studentName || !title || !issueDate)
    return res.status(400).json({ error: 'يرجى تعبئة كل الحقول' });

  const db = readDB();
  const id = uuidv4().slice(0, 8);

  const cert = {
    id,
    studentName,
    title,
    issueDate,
    issuer: req.user.name || 'جهة مُصدِّرة',
    status: 'صالح'
  };

  db.certificates.unshift(cert);
  writeDB(db);
  res.json(cert);
});

// ✅ حذف / إلغاء شهادة
app.delete('/api/certificates/:id', requireAuth, (req, res) => {
  const id = req.params.id;
  const db = readDB();

  const idx = db.certificates.findIndex(c => c.id === id);
  if (idx === -1)
    return res.status(404).json({ error: 'الشهادة غير موجودة' });

  db.certificates.splice(idx, 1);
  writeDB(db);

  res.json({ ok: true });
});

// ✅ التحقق من شهادة معينة
app.get('/api/verify/:id', (req, res) => {
  const id = req.params.id;
  const db = readDB();

  const c = db.certificates.find(c => c.id === id);
  if (!c)
    return res.json({ valid: false, message: 'لا توجد شهادة بهذا الرقم' });

  res.json({ valid: true, certificate: c });
});

// ✅ إعدادات تشغيل الواجهة الأمامية (frontend)
const FRONT = path.join(__dirname, '..', 'frontend');
app.use(express.static(FRONT));

app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(FRONT, 'index.html'));
});

// ✅ تشغيل السيرفر
app.listen(PORT, () =>
  console.log('🚀 API running on http://localhost:' + PORT)
);
