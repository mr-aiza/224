const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// اگه فایل‌ها توی ریشه هستن:
app.use(express.static(__dirname));
app.use(express.json());

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = 'mr-aiza';
const REPO_NAME = '224';

app.post('/submit', async (req, res) => {
  const formData = req.body;
  const date = formData.eventDate || new Date().toISOString().split('T')[0];

  const content = `
نام و نام خانوادگی: ${formData.fullname}
شماره تماس: ${formData.phone}
ایمیل: ${formData.email}
تاریخ مراسم: ${formData.eventDate}
نوع مراسم: ${formData.eventType}
امکانات انتخابی: ${formData.services}
توضیحات اضافی: ${formData.notes || '---'}
`;

  const filePath = `booking/contract-${date}.txt`;

  try {
    const response = await axios.put(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`,
      {
        message: `افزودن قولنامه رزرو برای ${date}`,
        content: Buffer.from(content).toString('base64'),
      },
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github+json',
        },
      }
    );

    console.log('✅ فایل روی گیت‌هاب ساخته شد');
    res.status(200).json({ message: 'رزرو با موفقیت ذخیره شد!' });

  } catch (err) {
    console.error('❌ خطا در ذخیره فایل در گیت‌هاب:', err.response?.data || err.message);
    res.status(500).json({ error: 'خطا در ذخیره رزرو در GitHub' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
