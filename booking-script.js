document.addEventListener("DOMContentLoaded", () => {
  const guestInput = document.getElementById("guestCount");
  const staffText = document.getElementById("staffCountText");
  const dateInput = document.getElementById("eventDate");
  const form = document.getElementById("bookingForm");
  const formError = document.getElementById("formError");
  const formSuccess = document.getElementById("formSuccess");
  const trackingCode = document.getElementById("trackingCode");

  // فعال‌سازی زیرمنوها
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

  // تقویم شمسی برای فیلد تاریخ
  if (typeof moment !== "undefined" && typeof moment().formatJalali !== "undefined") {
    moment.loadPersian({ dialect: "persian-modern", usePersianDigits: true });
  }

  dateInput.addEventListener("change", () => {
    const miladi = dateInput.value;
    if (miladi && moment(miladi, "YYYY-MM-DD").isValid()) {
      const jalali = moment(miladi, "YYYY-MM-DD").format("jYYYY/jMM/jDD");
      dateInput.setAttribute("data-shamsi", jalali);
    }
  });

  // بررسی تاریخ‌های رزرو شده و غیرفعال‌سازی
  fetch("reserved_dates.json")
    .then((res) => res.json())
    .then((reserved) => {
      const today = moment().format("YYYY-MM-DD");
      dateInput.setAttribute("min", today);

      reserved.forEach((dateStr) => {
        const option = document.createElement("option");
        option.disabled = true;
        option.text = `غیرفعال: ${dateStr}`;
        option.value = dateStr;
      });

      dateInput.addEventListener("input", () => {
        if (reserved.includes(dateInput.value)) {
          alert("این تاریخ قبلاً رزرو شده است.");
          dateInput.value = "";
        }
      });
    })
    .catch((err) => console.warn("خطا در خواندن reserved_dates.json:", err));

  // ارسال فرم به بک‌اند
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    formError.style.display = "none";
    formSuccess.style.display = "none";
    trackingCode.style.display = "none";

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

    try {
      const res = await fetch("https://two24-96ud.onrender.com/booking", {
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
