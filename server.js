const fs = require('fs');
const path = require('path');
const express = require('express');
const axios = require('axios');
const app = express();

const PORT = process.env.PORT || 3000;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = 'mr-aiza';
const REPO_NAME = '224';

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/submit', async (req, res) => {
  const newDate = req.body.eventDate;
  const reservedPath = path.join(__dirname, 'reserved_dates.json');
  const bookingFolder = path.join(__dirname, 'booking');
  const today = new Date().toISOString().split('T')[0];
  const fileName = `contract-${newDate || today}.txt`;
  const fileContent = generateBookingText(req.body);

  if (!fs.existsSync(bookingFolder)) {
    fs.mkdirSync(bookingFolder);
  }

  // مرحله ۱: ذخیره تاریخ در reserved_dates.json
  let reserved = [];
  if (fs.existsSync(reservedPath)) {
    try {
      reserved = JSON.parse(fs.readFileSync(reservedPath, 'utf8'));
    } catch (err) {
      console.error('خطا در تجزیه JSON:', err);
    }
  }
  if (!reserved.includes(newDate)) reserved.push(newDate);
  fs.writeFileSync(reservedPath, JSON.stringify(reserved, null, 2));

  // مرحله ۲: ذخیره فایل قرارداد در پوشه booking
  const localFilePath = path.join(bookingFolder, fileName);
  fs.writeFileSync(localFilePath, fileContent);

  // مرحله ۳: آپلود فایل در GitHub
  try {
    const githubApiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/booking/${fileName}`;
    const contentBase64 = Buffer.from(fileContent, 'utf8').toString('base64');

    await axios.put(
      githubApiUrl,
      {
        message: `رزرو جدید برای ${newDate}`,
        content: contentBase64
      },
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
          'User-Agent': 'booking-system'
        }
      }
    );
  } catch (err) {
    console.error('خطا در آپلود فایل به GitHub:', err.response?.data || err.message);
    return res.status(500).json({ error: 'خطا در آپلود فایل رزرو به گیت‌هاب' });
  }

  res.status(200).json({ message: 'رزرو با موفقیت ثبت شد و در گیت‌هاب ذخیره شد!' });
});

function generateBookingText(data) {
  const lines = [
    `📝 رزرو مراسم`,
    `--------------------------`,
    `نام: ${data.fullname}`,
    `شماره تماس: ${data.phone}`,
    `ایمیل: ${data.email}`,
    `تاریخ مراسم: ${data.eventDate}`,
    `نوع مراسم: ${data.eventType}`,
    `خدمات انتخاب‌شده: ${(Array.isArray(data.services) ? data.services.join(', ') : data.services || '-')}`,
    `فینگر فود: ${data.fingerFoodLevel || '-'}`,
    `گل‌آرایی: ${data.flowerDecorationLevel || '-'}`,
    `آب‌میوه: ${data.juiceLevel || '-'}`,
    `شام: ${data.dinnerType || '-'}`,
    `توضیحات اضافی: ${data.notes || '-'}`,
    `--------------------------`,
    `تاریخ ثبت: ${new Date().toLocaleString('fa-IR')}`
  ];
  return lines.join('\n');
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
