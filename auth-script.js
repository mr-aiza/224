document.addEventListener("DOMContentLoaded", () => {
  const authPopup = document.getElementById("auth-popup");
  const openAuthBtn = document.getElementById("open-auth");
  const closeBtn = document.getElementById("close-auth");
  const toLogin = document.getElementById("to-login");
  const toRegister = document.getElementById("to-register");
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const profileBox = document.getElementById("profile-box");
  const profileInfo = document.getElementById("profile-info");
  const logoutBtn = document.getElementById("logout-btn");

  openAuthBtn.onclick = () => authPopup.classList.remove("hidden");
  closeBtn.onclick = () => authPopup.classList.add("hidden");

  toLogin.onclick = () => {
    registerForm.classList.add("hidden");
    loginForm.classList.remove("hidden");
  };
  toRegister.onclick = () => {
    loginForm.classList.add("hidden");
    registerForm.classList.remove("hidden");
  };

  registerForm.onsubmit = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(registerForm));
    const res = await fetch("/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    alert(result.message);
    if (res.ok) {
      authPopup.classList.add("hidden");
      showProfile(data.fullname);
    }
  };

  loginForm.onsubmit = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(loginForm));
    const res = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    alert(result.message);
    if (res.ok) {
      authPopup.classList.add("hidden");
      showProfile(result.fullname);
    }
  };

  logoutBtn.onclick = () => {
    profileBox.classList.add("hidden");
    alert("با موفقیت خارج شدید");
  };

  function showProfile(name) {
    profileBox.classList.remove("hidden");
    profileInfo.textContent = `سلام، ${name} عزیز خوش اومدی!`;
  }
});
