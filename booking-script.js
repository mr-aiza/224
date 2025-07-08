// --- فعال/غیرفعال کردن زیرمنوها بر اساس چک‌باکس ---
const servicesCheckboxes = document.querySelectorAll('input[type="checkbox"][name="services"]');
servicesCheckboxes.forEach(chk => {
  chk.addEventListener('change', () => {
    const submenu = document.getElementById('submenu-' + chk.value);
    if (submenu) {
      submenu.style.display = chk.checked ? 'block' : 'none';

      // اگر تیک نخورده، رادیوها رو هم پاک کن
      if (!chk.checked) {
        const radios = submenu.querySelectorAll('input[type="radio"]');
        radios.forEach(r => r.checked = false);
      }
    }
  });
});

// در شروع صفحه، برای حالت پیش‌فرض زیرمنوها رو درست نمایش بده
servicesCheckboxes.forEach(chk => {
  const submenu = document.getElementById('submenu-' + chk.value);
  if (submenu) {
    submenu.style.display = chk.checked ? 'block' : 'none';
  }
});

// --- محاسبه مهمانداران بر اساس تعداد مهمان‌ها ---
const guestCountInput = document.getElementById('guestCount');
const staffCountText = document.getElementById('staffCountText');

function updateStaffCount() {
  let guestCount = parseInt(guestCountInput.value);
  if (isNaN(guestCount) || guestCount < 1) guestCount = 0;
  const staffCount = Math.ceil(guestCount / 15);
  staffCountText.textContent = `تعداد مهمانداران: ${staffCount}`;
}
guestCountInput.addEventListener('input', updateStaffCount);
updateStaffCount();

// --- تبدیل تاریخ میلادی به شمسی و نمایش زیر فیلد تاریخ ---
const eventDateInput = document.getElementById('eventDate');

// ایجاد المنت نمایش تاریخ شمسی زیر فیلد تاریخ
const persianDateDisplay = document.createElement('div');
persianDateDisplay.style.marginTop = '6px';
persianDateDisplay.style.color = '#880e4f';
persianDateDisplay.style.fontWeight = 'bold';
eventDateInput.parentNode.insertBefore(persianDateDisplay, eventDateInput.nextSibling);

eventDateInput.addEventListener('change', () => {
  if (eventDateInput.value) {
    // تبدیل تاریخ میلادی به شمسی با moment-jalaali
    const m = moment(eventDateInput.value, 'YYYY-MM-DD');
    persianDateDisplay.textContent = 'تاریخ شمسی: ' + m.format('jYYYY/jMM/jDD');
  } else {
    persianDateDisplay.textContent = '';
  }
});

// --- کنترل موسیقی ---
const audio = document.getElementById('bgMusic');
const audioToggleBtn = document.getElementById('audioToggle');
let isPlaying = false;

audioToggleBtn.addEventListener('click', () => {
  if (isPlaying) {
    audio.pause();
    audioToggleBtn.innerHTML = '<i class="fa fa-music"></i>';
  } else {
    audio.play().catch(() => alert("برای پخش موسیقی ابتدا روی صفحه کلیک کنید."));
    audioToggleBtn.innerHTML = '<i class="fa fa-pause"></i>';
  }
  isPlaying = !isPlaying;
});

document.addEventListener('click', function autoPlayOnce() {
  audio.play().catch(() => {});
  document.removeEventListener('click', autoPlayOnce);
});

// --- اعتبارسنجی فرم و نمایش کد پیگیری ---
const bookingForm = document.getElementById('bookingForm');
const formError = document.getElementById('formError');
const formSuccess = document.getElementById('formSuccess');
const trackingCodeDiv = document.getElementById('trackingCode');

function generateTrackingCode() {
  const now = Date.now().toString(36).toUpperCase();
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `RW-${now}-${rand}`;
}

bookingForm.addEventListener('submit', (e) => {
  e.preventDefault();

  formError.style.display = 'none';
  formSuccess.style.display = 'none';
  trackingCodeDiv.style.display = 'none';

  if (!bookingForm.checkValidity()) {
    formError.textContent = 'لطفاً تمام فیلدهای اجباری را به درستی پر کنید.';
    formError.style.display = 'block';
    return;
  }

  const anyServiceChecked = [...servicesCheckboxes].some(chk => chk.checked);
  if (!anyServiceChecked) {
    formError.textContent = 'لطفاً حداقل یک خدمت را انتخاب کنید.';
    formError.style.display = 'block';
    return;
  }

  const trackingCode = generateTrackingCode();
  formSuccess.textContent = 'رزرو شما با موفقیت ثبت شد!';
  formSuccess.style.display = 'block';
  trackingCodeDiv.textContent = 'کد پیگیری شما: ' + trackingCode;
  trackingCodeDiv.style.display = 'block';

  // ارسال اطلاعات به سرور یا ذخیره در گیت‌هاب اینجا انجام شود

  // در صورت نیاز فرم را ریست کن
  // bookingForm.reset();
  // updateStaffCount();
  // مخفی کردن زیرمنوها پس از ریست
  // servicesCheckboxes.forEach(chk => {
  //   const submenu = document.getElementById('submenu-' + chk.value);
  //   if (submenu) submenu.style.display = 'none';
  // });
});
