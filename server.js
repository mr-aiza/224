const express = require('express');
const axios = require('axios');
const app = express();

const PORT = process.env.PORT || 3000;

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = 'mr-aiza';
const REPO_NAME = '224';
const BRANCH = 'main';
const path = require('path');
app.use(express.static(path.join(__dirname)));

// کمک‌فانکشن برای خواندن فایل از GitHub
async function getFileContent(path) {
  try {
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}?ref=${BRANCH}`;
    const res = await axios.get(url, {
      headers: { Authorization: `Bearer ${GITHUB_TOKEN}` }
    });
    return res.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return null; // فایل وجود ندارد
    }
    throw error;
  }
}

// کمک‌فانکشن برای آپلود یا آپدیت فایل در GitHub
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
    const dateISO = now.toISOString().split('T')[0];
    const contractPath = `booking/contract-${dateISO}.txt`;
    const reservedDatesPath = 'reserved_dates.json';

    // --- ذخیره قرارداد متنی ---
    const contractContent = Object.entries(req.body)
      .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
      .join('\n');

    const contractContentBase64 = Buffer.from(contractContent).toString('base64');

    // --- خواندن فایل reserved_dates.json از گیت‌هاب ---
    let reservedData = await getFileContent(reservedDatesPath);
    let reservedDates = [];

    if (reservedData) {
      reservedDates = JSON.parse(Buffer.from(reservedData.content, 'base64').toString('utf8'));
    }

    // اضافه کردن تاریخ مراسم جدید
    const eventDate = req.body.eventDate;
    if (reservedDates.includes(eventDate)) {
      return res.status(400).json({ error: 'این تاریخ قبلاً رزرو شده است.' });
    }
    reservedDates.push(eventDate);

    const reservedDatesBase64 = Buffer.from(JSON.stringify(reservedDates, null, 2)).toString('base64');

    // --- آپلود قرارداد ---
    await uploadFile(contractPath, contractContentBase64, `اضافه کردن رزرو جدید برای ${dateISO}`);

    // --- آپدیت reserved_dates.json ---
    await uploadFile(reservedDatesPath, reservedDatesBase64, `به‌روزرسانی تاریخ‌های رزرو شده تا ${dateISO}`, reservedData ? reservedData.sha : undefined);

    res.status(200).json({ message: 'رزرو با موفقیت ثبت و ذخیره شد!' });

  } catch (error) {
    console.error('خطا:', error.response?.data || error.message);
    res.status(500).json({ error: 'خطا در ثبت رزرو.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
