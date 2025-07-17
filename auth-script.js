document.addEventListener("DOMContentLoaded", () => {
  const authBtn = document.getElementById("authBtn");
  const modal = document.getElementById("authModal");
  const closeBtn = document.querySelector(".close");
  const authForm = document.getElementById("authForm");
  const profile = document.getElementById("userProfile");
  const logoutBtn = document.getElementById("logoutBtn");
  const userNameSpan = document.getElementById("userName");

  // باز کردن پاپ‌آپ
  authBtn.onclick = () => {
    modal.style.display = "block";
  };

  // بستن پاپ‌آپ
  closeBtn.onclick = () => {
    modal.style.display = "none";
  };

  // ارسال فرم
  authForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fullName = document.getElementById("fullName").value;
    const phoneNumber = document.getElementById("phoneNumber").value;

    try {
      const res = await fetch("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, phoneNumber })
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("user", JSON.stringify({ fullName, phoneNumber }));
        modal.style.display = "none";
        userNameSpan.textContent = fullName;
        profile.style.display = "block";
        authBtn.style.display = "none";
      } else {
        alert(data.message || "خطایی رخ داد");
      }
    } catch (err) {
      console.error("Error:", err);
    }
  });

  // خروج از حساب
  logoutBtn.onclick = () => {
    localStorage.removeItem("user");
    profile.style.display = "none";
    authBtn.style.display = "inline-block";
  };

  // بررسی وضعیت لاگین
  const user = JSON.parse(localStorage.getItem("user"));
  if (user) {
    userNameSpan.textContent = user.fullName;
    profile.style.display = "block";
    authBtn.style.display = "none";
  }
});
