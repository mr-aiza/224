const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;

// سرو کردن فایل‌های استاتیک در پوشه public (اگر فایل‌ها داخل public نیستند، آدرس را تغییر بده)
app.use(express.static(path.join(__dirname, 'public')));

// اگر فایل‌های html مثل index.html توی ریشه پروژه هستند، باید این روت را اضافه کنیم:
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// سایر روت‌ها هم اگر داری، اضافه کن

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
