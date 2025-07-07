const fs = require('fs');
const express = require('express');
const app = express();
const path = require('path');

const PORT = process.env.PORT || 3000;

app.use(express.json());

// سرو فایل‌های استاتیک مستقیم از ریشه پروژه
app.use(express.static(__dirname));

// روت صفحه اصلی
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// API برای ذخیره تاریخ رزرو
app.post('/submit', (req, res) => {
  const newDate = req.body.date;

  fs.readFile(path.join(__dirname, 'reserved_dates.json'), 'utf8', (err, data) => {
    if (err) {
      console.error('خطا در خواندن فایل:', err);
      return res.status(500).json({ error: 'خواندن فایل شکست خورد' });
    }

    let reserved = [];
    try {
      reserved = JSON.parse(data);
    } catch (parseErr) {
      console.error('خطا در تجزیه JSON:', parseErr);
    }

    reserved.push(newDate);

    fs.writeFile(path.join(__dirname, 'reserved_dates.json'), JSON.stringify(reserved), (err) => {
      if (err) {
        console.error('خطا در نوشتن فایل:', err);
        return res.status(500).json({ error: 'ذخیره تاریخ شکست خورد' });
      }

      res.status(200).json({ message: 'تاریخ ذخیره شد' });
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
