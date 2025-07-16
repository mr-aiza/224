document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('ابتدا وارد شوید');
    window.location.href = 'auth.html';
    return;
  }

  const notificationDiv = document.getElementById('notification');
  const profileImage = document.getElementById('profileImage');
  const fullnameInput = document.getElementById('fullnameInput');
  const phoneInput = document.getElementById('phoneInput');
  const roleDisplay = document.getElementById('roleDisplay');
  const saveProfileBtn = document.getElementById('saveProfileBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  const futureReservationsUL = document.getElementById('futureReservations');
  const pastReservationsUL = document.getElementById('pastReservations');
  const totalReservationsSpan = document.getElementById('totalReservations');
  const cancelledReservationsUL = document.getElementById('cancelledReservations');

  const profileImageInput = document.getElementById('profileImageInput');
  const uploadImageBtn = document.getElementById('uploadImageBtn');

  let currentUser = null;
  let reservations = [];
  let cancelledReservations = [];

  // نوتیفیکیشن
  function showNotification(message, type='success') {
    notificationDiv.textContent = message;
    notificationDiv.className = 'notifications ' + type;
    notificationDiv.style.display = 'block';
    setTimeout(() => {
      notificationDiv.style.display = 'none';
    }, 4000);
  }

  // دریافت اطلاعات کاربر
  async function fetchProfile() {
    try {
      const res = await fetch('/profile', {
        headers: { Authorization: 'Bearer ' + token }
      });
      if (!res.ok) throw new Error('توکن نامعتبر یا دسترسی غیرمجاز');
      const data = await res.json();
      currentUser = data.user;
      fullnameInput.value = currentUser.fullname || '';
      phoneInput.value = currentUser.phone || '';
      roleDisplay.textContent = currentUser.role || 'نامشخص';

      // بارگذاری تصویر پروفایل اگر ذخیره شده باشد
      fetchProfileImage();

      // بارگذاری رزروها
      await fetchReservations();
      await fetchCancelledReservations();
    } catch (err) {
      alert(err.message);
      localStorage.removeItem('token');
      window.location.href = 'auth.html';
    }
  }

  // دریافت تصویر پروفایل از localStorage یا پیش‌فرض
  async function fetchProfileImage() {
    try {
      const cachedImg = localStorage.getItem('profileImageBase64');
      if (cachedImg) {
        profileImage.src = cachedImg;
        return;
      }
      // تصویر پیش‌فرض
      profileImage.src = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
    } catch (err) {
      console.error('خطا در بارگذاری تصویر پروفایل:', err);
      profileImage.src = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
    }
  }

  // آپلود تصویر پروفایل
  async function uploadProfileImage(base64Image) {
    try {
      const res = await fetch('/upload-profile-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token
        },
        body: JSON.stringify({ imageBase64: base64Image })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'خطا در آپلود تصویر');
      }

      localStorage.setItem('profileImageBase64', base64Image);
      profileImage.src = base64Image;
      showNotification('تصویر پروفایل با موفقیت آپلود شد', 'success');
    } catch (err) {
      showNotification(err.message, 'error');
    }
  }

  // دریافت رزروهای کاربر
  async function fetchReservations() {
    try {
      const res = await fetch('/reservations', {
        headers: { Authorization: 'Bearer ' + token }
      });
      if (!res.ok) throw new Error('خطا در دریافت رزروها');
      reservations = await res.json();

      const userReservations = reservations.filter(r => r.phone === currentUser.phone);
      totalReservationsSpan.textContent = userReservations.length;

      const now = new Date();
      futureReservationsUL.innerHTML = '';
      pastReservationsUL.innerHTML = '';

      userReservations.forEach(r => {
        const li = document.createElement('li');
        li.textContent = `تاریخ: ${r.date} - مراسم: ${r.eventType || 'نامشخص'}`;
        if (new Date(r.date) > now) {
          const cancelBtn = document.createElement('button');
          cancelBtn.textContent = 'لغو';
          cancelBtn.addEventListener('click', () => cancelReservation(r.id));
          li.appendChild(cancelBtn);
          futureReservationsUL.appendChild(li);
        } else {
          pastReservationsUL.appendChild(li);
        }
      });

    } catch (err) {
      showNotification(err.message, 'error');
    }
  }

  // دریافت رزروهای لغو شده
  async function fetchCancelledReservations() {
    try {
      const res = await fetch('/cancelled-reservations', {
        headers: { Authorization: 'Bearer ' + token }
      });
      if (!res.ok) throw new Error('خطا در دریافت رزروهای لغو شده');
      cancelledReservations = await res.json();

      const userCancelled = cancelledReservations.filter(r => r.phone === currentUser.phone);

      cancelledReservationsUL.innerHTML = '';
      if(userCancelled.length === 0){
        cancelledReservationsUL.textContent = 'رزرو لغو شده‌ای وجود ندارد.';
        return;
      }

      userCancelled.forEach(r => {
        const li = document.createElement('li');
        li.textContent = `تاریخ: ${r.date} - مراسم: ${r.eventType || 'نامشخص'}`;
        cancelledReservationsUL.appendChild(li);
      });

    } catch (err) {
      showNotification(err.message, 'error');
    }
  }

  // لغو رزرو
  async function cancelReservation(reservationId) {
    if (!confirm('آیا مطمئن هستید که می‌خواهید این رزرو را لغو کنید؟')) return;

    try {
      const res = await fetch(`/cancel-reservation/${reservationId}`, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token }
      });
      if (!res.ok) throw new Error('خطا در لغو رزرو');

      showNotification('رزرو با موفقیت لغو شد', 'success');
      await fetchReservations();
      await fetchCancelledReservations();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  }

  // ذخیره ویرایش پروفایل
  saveProfileBtn.addEventListener('click', async () => {
    const newFullname = fullnameInput.value.trim();
    const newPhone = phoneInput.value.trim();

    if (!newFullname || !/^09\d{9}$/.test(newPhone)) {
      showNotification('لطفاً نام و شماره تلفن صحیح را وارد کنید', 'error');
      return;
    }

    try {
      const res = await fetch('/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token
        },
        body: JSON.stringify({ fullname: newFullname, phone: newPhone })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'خطا در به‌روزرسانی پروفایل');
      }
      showNotification('پروفایل با موفقیت به‌روزرسانی شد', 'success');
      currentUser.fullname = newFullname;
      currentUser.phone = newPhone;
    } catch (err) {
      showNotification(err.message, 'error');
    }
  });

  // آپلود تصویر پروفایل
  uploadImageBtn.addEventListener('click', () => {
    const file = profileImageInput.files[0];
    if (!file) {
      showNotification('لطفاً یک تصویر انتخاب کنید', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64Image = reader.result;
      uploadProfileImage(base64Image);
    };
    reader.readAsDataURL(file);
  });

  // لاگ‌اوت خودکار پس از 30 دقیقه
  setTimeout(() => {
    localStorage.removeItem('token');
    alert('به دلیل عدم فعالیت، از حساب کاربری خارج شدید');
    window.location.href = 'auth.html';
  }, 30 * 60 * 1000);

  // دکمه خروج
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = 'auth.html';
  });

  // شروع بارگذاری پروفایل
  fetchProfile();
});
