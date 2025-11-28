// ===== إعدادات السيرفر =====
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// مجلد المواقع
const SITES_DIR = path.join(__dirname, 'sites');
if (!fs.existsSync(SITES_DIR)) fs.mkdirSync(SITES_DIR, { recursive: true });

// إعداد رفع الملفات
const upload = multer({ dest: 'uploads/' });

// ===== API رفع المواقع =====
app.post('/upload', upload.array('files'), (req, res) => {
  const siteName = (req.body.siteName || '').trim().toLowerCase().replace(/\s+/g, '-');
  if (!siteName) return res.status(400).send('اسم الموقع مطلوب');

  const sitePath = path.join(SITES_DIR, siteName);
  if (!fs.existsSync(sitePath)) fs.mkdirSync(sitePath, { recursive: true });

  req.files.forEach(file => {
    const dest = path.join(sitePath, file.originalname);
    fs.renameSync(file.path, dest);
  });

  // تحقق من وجود index.html
  const indexPath = path.join(sitePath, 'index.html');
  if (!fs.existsSync(indexPath)) {
    return res.status(400).send('لازم ترفع ملف index.html علشان الموقع يشتغل');
  }

  const url = `/sites/${siteName}/index.html`;
  res.send(`تم النشر! افتح: <a href="${url}" target="_blank">${url}</a>`);
});

// ===== خدمة المواقع المنشورة =====
app.use('/sites', express.static(SITES_DIR));

// ===== واجهة المستخدم (HTML) =====
app.get('/', (req, res) => {
  res.send(`
<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>منصة نشر مواقع</title>
  <style>
    body { font-family: sans-serif; background:#0f172a; color:#e2e8f0; padding:40px; }
    .box { max-width:600px; margin:auto; background:#111827; padding:20px; border-radius:10px; }
    input,button { width:100%; margin:10px 0; padding:10px; border-radius:8px; border:none; }
    input { background:#0b1220; color:#e2e8f0; }
    button { background:#2563eb; color:white; cursor:pointer; }
    .result { margin-top:15px; }
  </style>
</head>
<body>
  <div class="box">
    <h1>منصة نشر مواقع</h1>
    <form id="form">
      <input type="text" name="siteName" placeholder="اسم الموقع" required />
      <input type="file" name="files" multiple required />
      <button type="submit">نشر الموقع</button>
    </form>
    <div class="result" id="result"></div>
  </div>
<script>
document.getElementById('form').addEventListener('submit', async e => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const res = await fetch('/upload', { method:'POST', body:formData });
  const text = await res.text();
  document.getElementById('result').innerHTML = '<p>'+text+'</p>';
});
</script>
</body>
</html>
  `);
});

// ===== تشغيل السيرفر =====
app.listen(PORT, () => {
  console.log('Server running at http://localhost:' + PORT);
});
