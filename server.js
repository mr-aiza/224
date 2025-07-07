const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

const reservedDatesPath = path.join(__dirname, 'reserved_dates.json');
const bookingFolder = path.join(__dirname, 'booking');

// اطمینان از وجود پوشه booking
if (!fs.existsSync(bookingFolder)) {
  fs.mkdirSync(bookingFolder);
}

app.post('/submit', (req, res) => {
  const reservation = req.body;

  // ابتدا تاریخ را به reserved_dates.json اضافه کن
  fs.readFile(reservedDatesPath, 'utf8', (err, data) => {
    let reservedDates = [];
    if (!err && data) {
      try {
        reservedDates = JSON.parse(data);
      } catch {
        reservedDates = [];
      }
    }

    if (reservedDates.includes(reservation.eventDate)) {
      return res.status(400).json({ error: 'این تاریخ قبلا رزرو شده است' });
    }

    reservedDates.push(reservation.eventDate);
    fs.writeFile(reservedDatesPath, JSON.stringify(reservedDates, null, 2), (err) => {
      if (err) {
        console.error('خطا در ذخیره تاریخ رزرو:', err);
        return res.status(500).json({ error: 'ذخیره تاریخ ناموفق بود' });
      }

      // سپس کل رزرو را در یک فایل جدا ذخیره کن
      // نام فایل رو میذاریم مثل: booking-تاریخ-زمان.json برای یکتا بودن
      const now = new Date();
      const filename = `booking-${reservation.eventDate}-${now.getTime()}.json`;
      const filepath = path.join(bookingFolder, filename);

      fs.writeFile(filepath, JSON.stringify(reservation, null, 2), (err) => {
        if (err) {
          console.error('خطا در ذخیره فایل رزرو:', err);
          return res.status(500).json({ error: 'ذخیره رزرو ناموفق بود' });
        }

        res.status(200).json({ message: 'رزرو با موفقیت ثبت شد' });
      });
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
