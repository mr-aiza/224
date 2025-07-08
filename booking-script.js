// دریافت المنت‌ها
const dateInput = document.getElementById('eventDate');
const form = document.getElementById('bookingForm');
const formError = document.getElementById('formError');
const formSuccess = document.getElementById('formSuccess');
const trackingCodeElem = document.getElementById('trackingCode');
const guestCountInput = document.getElementById('guestCount');
const staffCountText = document.getElementById('staffCountText');
const bgMusic = document.getElementById('bgMusic');
const audioToggle = document.getElementById('audioToggle');

const reservedDatesUrl = 'reserved_dates.json';
let reservedDates = [];

// شمسی‌سازی تاریخ با moment-jalaali
function toJalaali(dateStr) {
  if (window.moment && window.moment.loadPersian) {
    return window.moment(dateStr).format('jYYYY/jMM/jDD');
  }
  return dateStr;
}

// بارگذاری تاریخ‌های رزرو شده و غیر فعال‌سازی آن‌ها
async function loadReservedDates() {
  try {
    const response = await fetch(reservedDatesUrl);
    if (!response.ok) throw new Error('خطا در دریافت تاریخ‌ها');
    reservedDates = await response.json();
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;

    dateInput.addEventListener('input', () => {
      if (reservedDates.includes(dateInput.value)) {
        alert('این تاریخ قبلاً رزرو شده است.');
        dateInput.value = '';
      }
    });
  } catch (err) {
    console.error(err);
  }
}
loadReservedDates();

// نمایش زیرمنوها
const servicesCheckboxes = {
  fingerFood: document.getElementById('fingerFood'),
  flowerDecoration: document.getElementById('flowerDecoration'),
  dinner: document.getElementById('dinner'),
  juice: document.getElementById('juice'),
};
const submenus = {
  fingerFood: document.getElementById('submenu-fingerFood'),
  flowerDecoration: document.getElementById('submenu-flowerDecoration'),
  dinner: document.getElementById('submenu-dinner'),
  juice: document.getElementById('submenu-juice'),
};
Object.keys(servicesCheckboxes).forEach((key) => {
  servicesCheckboxes[key].addEventListener('change', (e) => {
    submenus[key].style.display = e.target.checked ? 'block' : 'none';
    if (!e.target.checked) {
      const radios = submenus[key].querySelectorAll('input[type="radio"]');
      radios.forEach((r) => (r.checked = false));
    }
  });
});

// محاسبه مهماندار
guestCountInput.addEventListener('input', () => {
  const guests = parseInt(guestCountInput.value, 10);
  const staff = !isNaN(guests) && guests > 0 ? Math.ceil(guests / 15) : 0;
  staffCountText.textContent = `تعداد مهمانداران: ${staff}`;
});

// کنترل موزیک
audioToggle.addEventListener('click', () => {
  if (bgMusic.paused) {
    bgMusic.play();
    audioToggle.style.backgroundColor = '#b71c1c';
  } else {
    bgMusic.pause();
    audioToggle.style.backgroundColor = '#ec407a';
  }
});

// تولید کد پیگیری
function generateTrackingCode() {
  return 'TRK-' + Date.now().toString(36).toUpperCase();
}

// ارسال فرم
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  formError.style.display = 'none';
  formError.textContent = '';
  formSuccess.style.display = 'none';
  trackingCodeElem.style.display = 'none';

  // اعتبارسنجی شماره و تاریخ
  if (!dateInput.value || reservedDates.includes(dateInput.value)) {
    formError.style.display = 'block';
    formError.textContent = 'تاریخ نامعتبر یا رزرو شده انتخاب شده است.';
    return;
  }
  const phonePattern = /^09\d{9}$/;
  if (!phonePattern.test(form.phone.value)) {
    formError.style.display = 'block';
    formError.textContent = 'فرمت شماره تلفن نادرست است.';
    return;
  }

  // زیرگزینه‌ها
  for (const key of Object.keys(servicesCheckboxes)) {
    if (servicesCheckboxes[key].checked) {
      const radios = submenus[key].querySelectorAll('input[type="radio"]');
      if (![...radios].some((r) => r.checked)) {
        formError.style.display = 'block';
        formError.textContent = `لطفاً سطح ${key} را مشخص کنید.`;
        return;
      }
    }
  }

  const trackingCode = generateTrackingCode();
  const selectedServices = [];
  document.querySelectorAll('input[name="services"]:checked').forEach((el) => {
    selectedServices.push(el.value);
  });

  const contractText = `
fullname: ${form.fullname.value}
phone: ${form.phone.value}
email: ${form.email.value}
eventDate: ${form.eventDate.value}
eventType: ${form.eventType.value}
services: ${selectedServices.join(', ')}
fingerFoodLevel: ${(form.fingerFoodLevel?.value) || ''}
flowerDecorationLevel: ${(form.flowerDecorationLevel?.value) || ''}
dinnerType: ${(form.dinnerType?.value) || ''}
juiceLevel: ${(form.juiceLevel?.value) || ''}
guestCount: ${form.guestCount.value}
notes: ${form.notes.value}
trackingCode: ${trackingCode}
  `.trim();

  // ارسال به بک‌اند
  try {
    const res = await fetch(form.action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullname: form.fullname.value,
        phone: form.phone.value,
        email: form.email.value,
        eventDate: form.eventDate.value,
        eventType: form.eventType.value,
        services: selectedServices,
        fingerFoodLevel: form.fingerFoodLevel?.value || '',
        flowerDecorationLevel: form.flowerDecorationLevel?.value || '',
        dinnerType: form.dinnerType?.value || '',
        juiceLevel: form.juiceLevel?.value || '',
        guestCount: form.guestCount.value,
        notes: form.notes.value,
        trackingCode,
        contractText,
      }),
    });

    if (res.ok) {
      formSuccess.style.display = 'block';
      formSuccess.textContent = 'رزرو با موفقیت ثبت شد!';
      trackingCodeElem.style.display = 'block';
      trackingCodeElem.textContent = `کد پیگیری: ${trackingCode}`;

      // دانلود فایل قرارداد
      const blob = new Blob([contractText], { type: 'text/plain;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `contract-${trackingCode}.txt`;
      link.click();

      form.reset();
      loadReservedDates();
      staffCountText.textContent = 'تعداد مهمانداران: 0';
    } else {
      throw new Error('خطا در ارسال رزرو');
    }
  } catch (err) {
    formError.style.display = 'block';
    formError.textContent = err.message || 'خطا در ارسال';
  }
});
