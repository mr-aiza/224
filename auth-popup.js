<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>احراز هویت</title>
  <link rel="stylesheet" href="Style.css" />
</head>
<body>
  <div class="auth-container">
    <h2>ورود یا ثبت‌نام</h2>
    <input type="text" id="username" placeholder="نام کاربری" />
    <input type="password" id="password" placeholder="رمز عبور" />
    <button onclick="auth('login')">ورود</button>
    <button onclick="auth('register')">ثبت‌نام</button>
    <p id="error"></p>
  </div>

  <script src="auth.js"></script>
</body>
</html>
