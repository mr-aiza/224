const express = require('express');
const axios = require('axios');
const app = express();

const PORT = process.env.PORT || 3000;

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = 'mr-aiza';
const REPO_NAME = '224';
const BRANCH = 'main';

// تابع کمکی: خواندن فایل از GitHub
async function getFileContent(path) {
  try {
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}?ref=${BRANCH}`;
    const res = await axios.get(url, {
      headers: { Authorization: `Bearer ${GITHUB_TOKEN}` }
    });
    return res.data; // شامل content و sha
  } catch (error) {
    if (error.response?.status === 404) return null;
    throw error;
  }
}

// تابع کمکی: آپلود یا ویرایش فایل در GitHub
async function uploadFile(path, contentBase64, message, sha = null) {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;
  const body = {
    message,
    content: contentBase64,
    branch: BRANCH,
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

app.use(express.json());

app.post('/submit', async (req, res) => {
  try {
    const now = new Date();
    const todayISO = now.toISOString().split('T')[0];
    const reservedDatesPath = 'reserved_dates.json';
    const bookingDir = 'booking';

    // تاریخ مراسمی که کاربر وارد کرده
    const eventDate = req.body.eventDate;

    // 1. خواندن فایل reserved_dates.json
    const reservedData = await getFileContent(reservedDatesPath);
    let reservedDates = [];

    if (reservedData) {
      const decoded = Buffer.from(reservedData.content, 'base64').toString('utf8');
      reservedDates = JSON.parse(decoded);
    }

    if (reservedDates.includes(eventDate)) {
      return res.status(400).json({ error: 'این تاریخ قبلاً رزرو شده است.' });
    }

    // 2. ساخت محتوای فایل رزرو (قرارداد متنی)
    const contractContent = Object.entries(req.body)
      .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
      .join('\n');

    const contractBase64 = Buffer.from(contractContent).toString('base64');

    // 3. ذخیره فایل در مسیر booking/contract-YYYY-MM-DD_HH-MM-SS.txt
    const timeStr = now.toISOString().replace(/[:.]/g, '-'); // برای یکتا بودن
    const contractFilename = `contract-${timeStr}.txt`;
    const contractPath = `${bookingDir}/${contractFilename}`;

    await uploadFile(
      contractPath,
      contractBase64,
      `افزودن فایل رزرو جدید برای ${eventDate}`
    );

    // 4. به‌روزرسانی reserved_dates.json
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

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
