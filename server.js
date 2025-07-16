const express = require('express');
const axios = require('axios');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = express();

const PORT = process.env.PORT || 3000;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = 'mr-aiza';
const REPO_NAME = '224';
const BRANCH = 'main';
const USERS_FILE = 'auth/users.json';
const SECRET_KEY = 'very_secret_key';

app.use(express.static(path.join(__dirname)));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- کمک‌ها برای GitHub ---
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

function generateToken(user) {
  return jwt.sign(user, SECRET_KEY, { expiresIn: '7d' });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET_KEY);
  } catch {
    return null;
  }
}

// --- مدیریت کاربران توسط ادمین ---
app.get('/admin/users', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const user = verifyToken(token);
  if (!user || user.role !== 'admin') return res.status(403).json({ error: 'دسترسی غیرمجاز' });

  try {
    const fileData = await getFileContent(USERS_FILE);
    const decoded = Buffer.from(fileData.content, 'base64').toString('utf8');
    const users = JSON.parse(decoded);
    res.status(200).json({ users });
  } catch (err) {
    console.error('❌ خطا در دریافت کاربران:', err);
    res.status(500).json({ error: 'خطا در دریافت کاربران' });
  }
});

app.post('/admin/delete-user', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const user = verifyToken(token);
  if (!user || user.role !== 'admin') return res.status(403).json({ error: 'دسترسی غیرمجاز' });

  const { phone } = req.body;
  try {
    const fileData = await getFileContent(USERS_FILE);
    const users = JSON.parse(Buffer.from(fileData.content, 'base64').toString('utf8'));
    const updatedUsers = users.filter(u => u.phone !== phone);
    const base64 = Buffer.from(JSON.stringify(updatedUsers, null, 2)).toString('base64');
    await uploadFile(USERS_FILE, base64, `حذف کاربر: ${phone}`, fileData.sha);
    res.status(200).json({ message: 'کاربر حذف شد' });
  } catch (err) {
    console.error('❌ خطا در حذف کاربر:', err);
    res.status(500).json({ error: 'خطا در حذف کاربر' });
  }
});

// --- ثبت‌نام ---
app.post('/register', async (req, res) => {
  try {
    const { fullname, phone, password, role } = req.body;
    const fileData = await getFileContent(USERS_FILE);
    let users = [];
    if (fileData) {
      const decoded = Buffer.from(fileData.content, 'base64').toString('utf8');
      users = JSON.parse(decoded);
    }

    if (users.some(u => u.phone === phone)) {
      return res.status(400).json({ error: 'کاربری با این شماره وجود دارد.' });
    }

    const hash = await bcrypt.hash(password, 10);
    const newUser = { fullname, phone, password: hash, role };
    users.push(newUser);
    const base64 = Buffer.from(JSON.stringify(users, null, 2)).toString('base64');
    await uploadFile(USERS_FILE, base64, `ثبت‌نام کاربر جدید: ${phone}`, fileData?.sha);

    res.status(200).json({ message: 'ثبت‌نام موفق بود' });
  } catch (err) {
    console.error('❌ خطای ثبت‌نام:', err);
    res.status(500).json({ error: 'خطا در ثبت‌نام' });
  }
});

// --- ورود ---
app.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    const fileData = await getFileContent(USERS_FILE);
    if (!fileData) return res.status(404).json({ error: 'داده‌ای موجود نیست' });

    const decoded = Buffer.from(fileData.content, 'base64').toString('utf8');
    const users = JSON.parse(decoded);
    const user = users.find(u => u.phone === phone);
    if (!user) return res.status(400).json({ error: 'کاربر یافت نشد' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'رمز اشتباه است' });

    const token = generateToken({ fullname: user.fullname, phone: user.phone, role: user.role });
    res.status(200).json({ token });
  } catch (err) {
    console.error('❌ خطای لاگین:', err);
    res.status(500).json({ error: 'خطا در ورود' });
  }
});

// --- اطلاعات پروفایل ---
app.get('/profile', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const user = verifyToken(token);
  if (!user) return res.status(401).json({ error: 'توکن نامعتبر' });
  res.status(200).json({ user });
});

// --- تغییر رمز عبور ---
app.post('/change-password', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const user = verifyToken(token);
    if (!user) return res.status(401).json({ error: 'توکن نامعتبر' });

    const { oldPassword, newPassword } = req.body;
    const fileData = await getFileContent(USERS_FILE);
    const users = JSON.parse(Buffer.from(fileData.content, 'base64').toString('utf8'));
    const target = users.find(u => u.phone === user.phone);

    const match = await bcrypt.compare(oldPassword, target.password);
    if (!match) return res.status(400).json({ error: 'رمز فعلی اشتباه است' });

    target.password = await bcrypt.hash(newPassword, 10);
    const base64 = Buffer.from(JSON.stringify(users, null, 2)).toString('base64');
    await uploadFile(USERS_FILE, base64, `تغییر رمز برای ${user.phone}`, fileData.sha);
    res.status(200).json({ message: 'رمز با موفقیت تغییر یافت' });
  } catch (err) {
    console.error('❌ خطا در تغییر رمز:', err);
    res.status(500).json({ error: 'خطا در تغییر رمز' });
  }
});



// تابع کمکی: دریافت محتویات فایل از GitHub
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

// تابع کمکی: آپلود یا بروزرسانی فایل در GitHub
async function uploadFile(filePath, contentBase64, message, sha = null) {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`;
  const body = {
    message,
    content: contentBase64,
    branch: BRANCH
  };
  if (sha) body.sha = sha;

  const res = await axios.put(url, body, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json'
    }
  });
  return res.data;
}

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
    const now = new Date();
    const todayISO = now.toISOString().split('T')[0];
    const reservedDatesPath = 'reserved_dates.json';
    const bookingDir = 'booking';
    const eventDate = req.body.eventDate;

    const reservedData = await getFileContent(reservedDatesPath);
    let reservedDates = [];

    if (reservedData) {
      const decoded = Buffer.from(reservedData.content, 'base64').toString('utf8');
      reservedDates = JSON.parse(decoded);
    }

    if (reservedDates.includes(eventDate)) {
      return res.status(400).json({ error: 'این تاریخ قبلاً رزرو شده است.' });
    }

    const contractContent = Object.entries(req.body)
      .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
      .join('\n');

    const contractBase64 = Buffer.from(contractContent).toString('base64');
    const timeStr = now.toISOString().replace(/[:.]/g, '-');
    const contractFilename = `contract-${timeStr}.txt`;
    const contractPath = `${bookingDir}/${contractFilename}`;

    await uploadFile(contractPath, contractBase64, `افزودن فایل رزرو جدید برای ${eventDate}`);
    reservedDates.push(eventDate);
    const reservedDatesBase64 = Buffer.from(JSON.stringify(reservedDates, null, 2)).toString('base64');

    await uploadFile(
      reservedDatesPath,
      reservedDatesBase64,
      `افزودن تاریخ رزرو ${eventDate}`,
      reservedData?.sha || undefined
    );

    res.status(200).json({ message: 'رزرو با موفقیت ثبت و ذخیره شد!' });
  } catch (err) {
    console.error('❌ خطا در ذخیره رزرو:', err.response?.data || err.message);
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
