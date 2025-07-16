document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('registerForm');
  const messageBox = document.getElementById('message');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fullname = form.fullname.value.trim();
    const phone = form.phone.value.trim();
    const password = form.password.value;
    const confirmPassword = form.confirmPassword.value;
    const role = form.role.value;  // مثلا 'customer' یا 'staff'

    messageBox.textContent = '';
    messageBox.className = '';

    if (!fullname || !phone || !password || !confirmPassword) {
      messageBox.textContent = 'لطفا تمام فیلدها را پر کنید.';
      messageBox.className = 'error';
      return;
    }

    if (password !== confirmPassword) {
      messageBox.textContent = 'رمز عبور و تکرار آن مطابقت ندارند.';
      messageBox.className = 'error';
      return;
    }

    try {
      const response = await fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullname, phone, password, role }),
      });

      const data = await response.json();

      if (response.ok) {
        messageBox.textContent = data.message || 'ثبت‌نام موفقیت‌آمیز بود.';
        messageBox.className = 'success';
        form.reset();
      } else {
        messageBox.textContent = data.error || 'خطا در ثبت‌نام.';
        messageBox.className = 'error';
      }
    } catch (error) {
      messageBox.textContent = 'خطا در ارتباط با سرور.';
      messageBox.className = 'error';
    }
  });
});
