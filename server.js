const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.post('/submit', (req, res) => {
  const newReservation = req.body;

  const filePath = path.join(__dirname, 'reserved_dates.json');

  fs.readFile(filePath, 'utf8', (err, data) => {
    let reservations = [];
    if (!err && data) {
      try {
        reservations = JSON.parse(data);
      } catch {
        reservations = [];
      }
    }
    reservations.push(newReservation);

    fs.writeFile(filePath, JSON.stringify(reservations, null, 2), (err) => {
      if (err) {
        console.error('خطا در ذخیره فایل:', err);
        return res.status(500).json({ error: 'ذخیره ناموفق بود' });
      }
      res.status(200).json({ message: 'رزرو با موفقیت ثبت شد' });
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
