const express = require('express');
const axios = require('axios');
const { encode, decode } = require('js-base64');
const app = express();
app.use(express.json());

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO = 'mr-aiza/224';
const FILE = 'reserved_dates.json';

app.post('/save-form', async (req, res) => {
  try {
    // دریافت فایل فعلی
    const fileResp = await axios.get(
      `https://api.github.com/repos/${REPO}/contents/${FILE}`,
      { headers: { Authorization: `token ${GITHUB_TOKEN}` } }
    );
    const sha = fileResp.data.sha;
    let content = [];
    if (fileResp.data.content) {
      content = JSON.parse(decode(fileResp.data.content));
    }
    content.push(req.body);

    // آپدیت فایل
    await axios.put(
      `https://api.github.com/repos/${REPO}/contents/${FILE}`,
      {
        message: "update reserved_dates.json",
        content: encode(JSON.stringify(content, null, 2)),
        sha: sha
      },
      { headers: { Authorization: `token ${GITHUB_TOKEN}` } }
    );
    res.send('ذخیره شد');
  } catch (e) {
    res.status(500).send('خطا در ذخیره');
  }
});

app.listen(3000);
