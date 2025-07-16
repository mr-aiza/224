// لاگین کاربر و ذخیره توکن
async function login(phone, password) {
  const res = await fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, password })
  });
  const data = await res.json();
  if (data.token) {
    localStorage.setItem('token', data.token);
    alert('ورود موفق');
  } else {
    alert('خطا در ورود: ' + (data.error || ''));
  }
}

// ارسال فرم رزرو با توکن
document.getElementById('bookingForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const token = localStorage.getItem('token');
  if (!token) {
    alert('لطفا ابتدا وارد شوید');
    return;
  }

  const formData = {
    fullname: e.target.fullname.value,
    phone: e.target.phone.value,
    email: e.target.email.value,
    eventDate: e.target.eventDate.value,
    eventType: e.target.eventType.value,
    services: Array.from(e.target.querySelectorAll('input[name="services"]:checked')).map(i => i.value),
    guestCount: e.target.guestCount.value,
    notes: e.target.notes.value
  };

  try {
    const res = await fetch('/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    });

    const data = await res.json();
    if (res.ok) {
      alert(data.message);
    } else {
      alert('خطا در رزرو: ' + (data.error || ''));
    }
  } catch (err) {
    alert('خطا در ارسال درخواست');
    console.error(err);
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const guestInput = document.getElementById("guestCount");
  const staffText = document.getElementById("staffCountText");
  const dateInput = document.getElementById("eventDate");
  const form = document.getElementById("bookingForm");
  const formError = document.getElementById("formError");
  const formSuccess = document.getElementById("formSuccess");
  const trackingCode = document.getElementById("trackingCode");

  // فعال‌سازی زیرمنوها برای هر چک‌باکس
  const checkboxes = document.querySelectorAll("input[type=checkbox]");
  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const submenu = document.getElementById(`submenu-${checkbox.id}`);
      if (submenu) submenu.style.display = checkbox.checked ? "block" : "none";
    });
  });

  // محاسبه تعداد مهماندار بر اساس تعداد مهمان
  guestInput.addEventListener("input", () => {
    const guestCount = parseInt(guestInput.value);
    if (!isNaN(guestCount) && guestCount > 0) {
      const staffCount = Math.ceil(guestCount / 15);
      staffText.textContent = `تعداد مهمانداران: ${staffCount}`;
    } else {
      staffText.textContent = "تعداد مهمانداران: 0";
    }
  });

  // بارگذاری تقویم شمسی (Jalali)
  if (typeof moment !== "undefined" && typeof moment().formatJalali !== "undefined") {
    moment.loadPersian({ dialect: "persian-modern", usePersianDigits: true });
  }

  // تبدیل تاریخ میلادی به شمسی و ذخیره در data attribute
dateInput.addEventListener("change", () => {
  const miladi = dateInput.value;
  if (miladi && moment(miladi, "YYYY-MM-DD").isValid()) {
    const jalali = moment(miladi, "YYYY-MM-DD").format("jYYYY/jMM/jDD");
    dateInput.setAttribute("data-shamsi", jalali);
    document.getElementById("shamsiDateDisplay").textContent = jalali;
  }
});


  // دریافت تاریخ‌های رزرو شده و بررسی تکراری بودن
  fetch("reserved_dates.json")
    .then((res) => res.json())
    .then((reserved) => {
      const today = moment().format("YYYY-MM-DD");
      dateInput.setAttribute("min", today);

      // بررسی اینکه تاریخ انتخابی جزو تاریخ‌های رزرو شده است یا نه
      dateInput.addEventListener("input", () => {
        if (reserved.includes(dateInput.value)) {
          alert("این تاریخ قبلاً رزرو شده است.");
          dateInput.value = "";
        }
      });
    })
    .catch((err) => {
      console.warn("خطا در خواندن reserved_dates.json:", err);
    });

  // ارسال فرم به بک‌اند
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // مخفی کردن پیام‌ها
    formError.style.display = "none";
    formSuccess.style.display = "none";
    trackingCode.style.display = "none";

    // خواندن داده‌های فرم
    const data = new FormData(form);
    const json = {};
    data.forEach((value, key) => {
      if (json[key]) {
        if (Array.isArray(json[key])) json[key].push(value);
        else json[key] = [json[key], value];
      } else {
        json[key] = value;
      }
    });

    // افزودن تاریخ شمسی و کد پیگیری
    const shamsiDate = dateInput.getAttribute("data-shamsi") || "بدون تاریخ شمسی";
    const code = `TRK-${Date.now().toString().slice(-6)}`;
    json.shamsiDate = shamsiDate;
    json.trackingCode = code;

    // ارسال به سرور
    try {
      const res = await fetch("/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(json),
      });

      const result = await res.json();

      if (res.ok) {
        formSuccess.textContent = "رزرو با موفقیت ثبت شد ✅";
        formSuccess.style.display = "block";
        trackingCode.innerHTML = `کد پیگیری شما: <strong>${code}</strong>`;
        trackingCode.style.display = "block";
        form.reset();
        staffText.textContent = "تعداد مهمانداران: 0";
      } else {
        formError.textContent = result.message || "خطا در ارسال فرم.";
        formError.style.display = "block";
      }
    } catch (err) {
      formError.textContent = "ارسال اطلاعات با مشکل مواجه شد.";
      formError.style.display = "block";
    }
  });
});
fetch('/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ fullname, phone, password })
})
