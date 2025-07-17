document.getElementById("authBtn").onclick = () => {
  document.getElementById("authPopup").style.display = "block";
};

document.getElementById("closePopup").onclick = () => {
  document.getElementById("authPopup").style.display = "none";
};

document.getElementById("switchForm").onclick = () => {
  const reg = document.getElementById("registerForm");
  const log = document.getElementById("loginForm");
  const switchText = document.getElementById("switchForm");
  if (reg.style.display === "none") {
    reg.style.display = "block";
    log.style.display = "none";
    switchText.textContent = "حساب دارید؟ وارد شوید";
  } else {
    reg.style.display = "none";
    log.style.display = "block";
    switchText.textContent = "ثبت‌نام ندارید؟ ثبت‌نام کنید";
  }
};

document.getElementById("registerForm").onsubmit = async (e) => {
  e.preventDefault();
  const name = document.getElementById("regName").value;
  const email = document.getElementById("regEmail").value;
  const password = document.getElementById("regPassword").value;

  const res = await fetch("/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });

  const data = await res.json();
  document.getElementById("authMessage").textContent = data.message;

  if (res.ok) {
    showProfile(name);
  }
};

document.getElementById("loginForm").onsubmit = async (e) => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  const res = await fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  document.getElementById("authMessage").textContent = data.message;

  if (res.ok) {
    showProfile(data.name);
  }
};

function showProfile(name) {
  document.getElementById("authPopup").style.display = "none";
  document.getElementById("userName").textContent = name;
  document.getElementById("userProfile").style.display = "block";
}

document.getElementById("logoutBtn").onclick = () => {
  document.getElementById("userProfile").style.display = "none";
  document.getElementById("authMessage").textContent = "از حساب خارج شدید.";
};
