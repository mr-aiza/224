require("dotenv").config();
const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// اتصال به MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ اتصال به MongoDB برقرار شد"))
  .catch((err) => console.error("❌ خطا در اتصال به MongoDB:", err));

// تنظیمات GitHub
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = 'mr-aiza';
const REPO_NAME = '224';
const BRANCH = 'main';
const USERS_FILE = 'auth/users.json';
const RESERVED_DATES_FILE = 'reserved_dates.json';

// میدلورها
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

// 📌 توابع JWT
function generateToken(user) {
  return jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

// 📂 توابع GitHub
async function getFileContent(filePath) {
  try {
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}?ref=${BRANCH}`;
    const res = await axios.get(url, {
      headers: { Authorization: `Bearer ${GITHUB_TOKEN}` }
    });
    return res.data;
  } catch (error) {
    if (error.response?.status === 404) return null;
    throw error;
  }
}

async function uploadFile(filePath, contentBase64, message, sha = null) {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`;
  const body = { message, content: contentBase64, branch: BRANCH };
  if (sha) body.sha = sha;

  const res = await axios.put(url, body, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json'
    }
  });
  return res.data;
}

// ✅ مسیرهای مربوط به احراز هویت
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'نام کاربری و رمز عبور الزامی است.' });

  const userFile = `users/${username}.json`;
  const exists = await getFileContent(userFile);
  if (exists) return res.status(409).json({ error: 'نام کاربری قبلاً ثبت شده.' });

  const content = Buffer.from(JSON.stringify({ username, password }), 'utf8').toString('base64');

  try {
    await uploadFile(userFile, content, `ثبت‌نام کاربر ${username}`);
    const token = generateToken({ username });
    res.json({ message: 'ثبت‌نام موفق بود.', token });
  } catch (e) {
    res.status(500).json({ error: 'خطا در ثبت‌نام.' });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const userFile = `users/${username}.json`;

  try {
    const fileData = await getFileContent(userFile);
    const user = JSON.parse(Buffer.from(fileData.content, 'base64').toString('utf8'));

    if (user.password !== password)
      return res.status(401).json({ error: 'رمز عبور نادرست است.' });

    const token = generateToken({ username });
    res.json({ message: 'ورود موفق بود.', token });
  } catch (e) {
    res.status(404).json({ error: 'کاربر یافت نشد.' });
  }
});

app.get('/profile', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const user = verifyToken(token);
  if (!user) return res.status(401).json({ error: 'توکن نامعتبر' });

  try {
    const fileData = await getFileContent(USERS_FILE);
    const users = JSON.parse(Buffer.from(fileData.content, 'base64').toString('utf8'));
    const currentUser = users.find(u => u.username === user.username);
    if (!currentUser) return res.status(404).json({ error: 'کاربر یافت نشد' });

    const safeUser = {
      username: currentUser.username,
      role: currentUser.role || 'user',
      reservations: currentUser.reservations || []
    };
    res.status(200).json({ user: safeUser });
  } catch (err) {
    res.status(500).json({ error: 'خطا در دریافت پروفایل' });
  }
});

// --- داینامیک sitemap.xml ---
app.get('/sitemap.xml', (req, res) => {
  res.header('Content-Type', 'application/xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://two24-96ud.onrender.com/</loc>
    <lastmod>2025-07-12</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://two24-96ud.onrender.com/about.html</loc>
    <lastmod>2025-07-12</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://two24-96ud.onrender.com/services.html</loc>
    <lastmod>2025-07-12</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://two24-96ud.onrender.com/portfolio.html</loc>
    <lastmod>2025-07-12</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://two24-96ud.onrender.com/booking.html</loc>
    <lastmod>2025-07-12</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://two24-96ud.onrender.com/contact.html</loc>
    <lastmod>2025-07-12</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://two24-96ud.onrender.com/waiter.html</loc>
    <lastmod>2025-07-16</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>`);
});



// --- رزرو مراسم ---
app.post('/submit', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const user = verifyToken(token);
    if (!user) return res.status(401).json({ error: 'توکن نامعتبر' });

    const { eventDate } = req.body;
    if (!eventDate) return res.status(400).json({ error: 'تاریخ رزرو ارسال نشده' });

    // خواندن تاریخ‌های رزرو شده
    const reservedData = await getFileContent(RESERVED_DATES_FILE);
    let reservedDates = [];
    let reservedSha = null;
    if (reservedData) {
      reservedDates = JSON.parse(Buffer.from(reservedData.content, 'base64').toString('utf8'));
      reservedSha = reservedData.sha;
    }

    if (reservedDates.includes(eventDate)) {
      return res.status(400).json({ error: 'این تاریخ قبلاً رزرو شده است.' });
    }

    // خواندن کاربران و آپدیت رزرو
    const usersData = await getFileContent(USERS_FILE);
    const users = JSON.parse(Buffer.from(usersData.content, 'base64').toString('utf8'));
    const currentUser = users.find(u => u.phone === user.phone);
    if (!currentUser) return res.status(404).json({ error: 'کاربر یافت نشد' });

    if (!currentUser.reservations) currentUser.reservations = [];
    if (currentUser.reservations.includes(eventDate)) {
      return res.status(400).json({ error: 'شما قبلا این تاریخ را رزرو کرده‌اید.' });
    }
    currentUser.reservations.push(eventDate);

    const usersBase64 = Buffer.from(JSON.stringify(users, null, 2)).toString('base64');
    await uploadFile(USERS_FILE, usersBase64, `آپدیت رزرو برای کاربر ${user.phone}`, usersData.sha);

    // ذخیره تاریخ رزرو جدید
    reservedDates.push(eventDate);
    const reservedBase64 = Buffer.from(JSON.stringify(reservedDates, null, 2)).toString('base64');
    await uploadFile(RESERVED_DATES_FILE, reservedBase64, `افزودن تاریخ رزرو ${eventDate}`, reservedSha);

    // ذخیره قرارداد به صورت فایل متنی
    const bookingDir = 'booking';
    const now = new Date();
    const timeStr = now.toISOString().replace(/[:.]/g, '-');
    const contractContent = Object.entries(req.body)
      .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
      .join('\n');
    const contractBase64 = Buffer.from(contractContent).toString('base64');
    const contractFilename = `contract-${timeStr}.txt`;
    const contractPath = `${bookingDir}/${contractFilename}`;
    await uploadFile(contractPath, contractBase64, `افزودن فایل رزرو جدید برای ${eventDate}`);

    res.status(200).json({ message: 'رزرو با موفقیت ثبت و ذخیره شد!' });

  } catch (err) {
    console.error('❌ خطا در ذخیره رزرو:', err.response?.data || err.message || err);
    res.status(500).json({ error: 'خطا در ثبت رزرو' });
  }
});


// --- تماس با ما ---
app.post('/contact', async (req, res) => {
  try {
    const contactDir = 'contact';
    const now = new Date();
    const timeStr = now.toISOString().replace(/[:.]/g, '-');
    const fileName = `message-${timeStr}.txt`;
    const filePath = `${contactDir}/${fileName}`;

    const messageContent = Object.entries(req.body)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');

    const contentBase64 = Buffer.from(messageContent).toString('base64');

    await uploadFile(filePath, contentBase64, `افزودن پیام جدید تماس با ما - ${timeStr}`);
    res.status(200).json({ message: 'پیام شما با موفقیت ثبت شد!' });
  } catch (err) {
    console.error('❌ خطا در ذخیره پیام تماس با ما:', err.response?.data || err.message);
    res.status(500).json({ error: 'خطا در ثبت پیام تماس با ما' });
  }
});

// --- همکاری عمومی (باغ‌دار، سالن‌دار و...) ---
app.post('/cooperation', async (req, res) => {
  try {
    const cooperationDir = 'cooperation1';
    const now = new Date();
    const timeStr = now.toISOString().replace(/[:.]/g, '-');
    const fileName = `partner-${timeStr}.txt`;
    const filePath = `${cooperationDir}/${fileName}`;

    const { fullname, phone, type, location, description } = req.body;

    const content = `
فرم همکاری جدید:

نام: ${fullname}
تلفن: ${phone}
نوع همکاری: ${type}
منطقه/شهر: ${location}
توضیحات:
${description || '---'}

ارسال شده در: ${now.toLocaleString('fa-IR')}
`.trim();

    const contentBase64 = Buffer.from(content).toString('base64');

    await uploadFile(filePath, contentBase64, `افزودن فرم همکاری ${fullname} - ${timeStr}`);
    res.status(200).json({ message: 'فرم همکاری با موفقیت ثبت شد ✅' });
  } catch (err) {
    console.error('❌ خطا در ثبت فرم همکاری:', err.response?.data || err.message);
    res.status(500).json({ error: 'خطا در ثبت فرم همکاری' });
  }
});

// --- استخدام مهماندار ---
app.post('/waiter', async (req, res) => {
  try {
    const cooperationDir = 'cooperation2';
    const now = new Date();
    const timeStr = now.toISOString().replace(/[:.]/g, '-');
    const fileName = `waiter-${timeStr}.txt`;
    const filePath = `${cooperationDir}/${fileName}`;

    const { fullname, phone, age, gender, city, experience, availability, description } = req.body;

    const content = `
فرم استخدام مهماندار جدید:

نام: ${fullname}
تلفن: ${phone}
سن: ${age}
جنسیت: ${gender}
شهر/منطقه: ${city}
تجربه: ${experience}
وضعیت حضور: ${availability}
توضیحات:
${description || '---'}

ارسال شده در: ${now.toLocaleString('fa-IR')}
`.trim();

    const contentBase64 = Buffer.from(content).toString('base64');

    await uploadFile(filePath, contentBase64, `افزودن فرم استخدام مهماندار ${fullname} - ${timeStr}`);
    res.status(200).json({ message: 'فرم استخدام مهماندار با موفقیت ثبت شد ✅' });
  } catch (err) {
    console.error('❌ خطا در ثبت فرم استخدام مهماندار:', err.response?.data || err.message);
    res.status(500).json({ error: 'خطا در ثبت فرم استخدام مهماندار' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
