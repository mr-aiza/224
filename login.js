document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const messageBox = document.getElementById('message');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const phone = form.phone.value.trim();
    const password = form.password.value;

    messageBox.textContent = '';
    messageBox.className = '';

    if (!phone || !password) {
      messageBox.textContent = 'لطفا شماره تلفن و رمز عبور را وارد کنید.';
      messageBox.className = 'error';
      return;
    }

    try {
      const response = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // ذخیره توکن JWT در localStorage
        localStorage.setItem('token', data.token);
        messageBox.textContent = 'ورود موفقیت‌آمیز بود.';
        messageBox.className = 'success';

        // هدایت به صفحه پروفایل (مثلاً profile.html)
        setTimeout(() => {
          window.location.href = 'profile.html';
        }, 1000);
      } else {
        messageBox.textContent = data.error || 'خطا در ورود.';
        messageBox.className = 'error';
      }
    } catch (error) {
      messageBox.textContent = 'خطا در ارتباط با سرور.';
      messageBox.className = 'error';
    }
  });
});
