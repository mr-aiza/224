const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('public')); // فولدر public برای فایل‌های استاتیک مثل HTML

const reservedDatesPath = path.join(__dirname, 'public', 'reserved_dates.json');

// دریافت تاریخ‌های رزرو شده
app.get('/reserved_dates.json', async (req, res) => {
  try {
    const data = await fs.readFile(reservedDatesPath, 'utf8');
    res.type('json').send(data);
  } catch {
    res.json([]);
  }
});

// دریافت فرم رزرو و ذخیره تاریخ
app.post('/submit', async (req, res) => {
  try {
    const { eventDate } = req.body;
    if (!eventDate) return res.status(400).send('تاریخ مراسم ضروری است.');

    // خواندن فایل موجود
    let dates = [];
    try {
      const data = await fs.readFile(reservedDatesPath, 'utf8');
      dates = JSON.parse(data);
    } catch {}

    if (dates.includes(eventDate)) {
      return res.status(409).send('این تاریخ قبلا رزرو شده است.');
    }

    dates.push(eventDate);
    await fs.writeFile(reservedDatesPath, JSON.stringify(dates, null, 
