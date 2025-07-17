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
const RESERVED_DATES_FILE = 'reserved_dates.json';
const SECRET_KEY = 'very_secret_key';
const User = require('User');
const express = require("express");
const bodyParser = require("body-parser");
const fetch = require("node-fetch");
const app = express();
require("dotenv").config();

const OWNER = "YourGitHubUser";
const REPO = "YourRepo";
const FILE_PATH = "users.json";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

app.use(express.json());

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'نام کاربری و رمز عبور الزامی است.' });

  const userFile = `users/${username}.json`;
  const exists = await checkIfFileExists(userFile);
  if (exists) return res.status(409).json({ error: 'نام کاربری قبلاً ثبت شده.' });

  const content = Buffer.from(JSON.stringify({ username, password }), 'utf8').toString('base64');

  try {
    await uploadFile(userFile, content, `ثبت‌نام کاربر ${username}`);
    res.json({ message: 'ثبت‌نام موفق بود.' });
  } catch (e) {
    res.status(500).json({ error: 'خطا در ثبت‌نام.' });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const userFile = `users/${username}.json`;

  try {
    const { content } = await getFile(userFile);
    const user = JSON.parse(Buffer.from(content, 'base64').toString('utf8'));

    if (user.password !== password)
      return res.status(401).json({ error: 'رمز عبور نادرست است.' });

    res.json({ message: 'ورود موفق بود.' });
  } catch (e) {
    res.status(404).json({ error: 'کاربر یافت نشد.' });
  }
});

// --- توابع کمکی ---
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
    const { fullname, phone, password, role = 'user' } = req.body;
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
    const newUser = { fullname, phone, password: hash, role, reservations: [] };
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

  try {
    const fileData = await getFileContent(USERS_FILE);
    const users = JSON.parse(Buffer.from(fileData.content, 'base64').toString('utf8'));
    const currentUser = users.find(u => u.phone === user.phone);
    if (!currentUser) return res.status(404).json({ error: 'کاربر یافت نشد' });

    const safeUser = {
      fullname: currentUser.fullname,
      phone: currentUser.phone,
      role: currentUser.role,
      reservations: currentUser.reservations || []
    };
    res.status(200).json({ user: safeUser });
  } catch (err) {
    console.error('❌ خطا در دریافت پروفایل:', err);
    res.status(500).json({ error: 'خطا در دریافت پروفایل' });
  }
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

// --- رزرو مراسم ---
app.post('/update-profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const user = verifyToken(token);
    if (!user) return res.status(401).json({ error: 'توکن نامعتبر' });

    const { fullname, phone } = req.body;
    if (!fullname || !phone) return res.status(400).json({ error: 'اطلاعات ناقص است' });

    const fileData = await getFileContent(USERS_FILE);
    const users = JSON.parse(Buffer.from(fileData.content, 'base64').toString('utf8'));
    const currentUser = users.find(u => u.phone === user.phone);
    if (!currentUser) return res.status(404).json({ error: 'کاربر یافت نشد' });

    currentUser.fullname = fullname;
    currentUser.phone = phone;

    const base64 = Buffer.from(JSON.stringify(users, null, 2)).toString('base64');
    await uploadFile(USERS_FILE, base64, `بروزرسانی پروفایل ${user.phone}`, fileData.sha);

    res.status(200).json({ message: 'پروفایل با موفقیت به‌روزرسانی شد' });
  } catch (err) {
    console.error('❌ خطا در بروزرسانی پروفایل:', err);
    res.status(500).json({ error: 'خطا در بروزرسانی پروفایل' });
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
