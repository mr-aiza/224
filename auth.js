function auth(mode) {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const error = document.getElementById("error");

  if (!username || !password) {
    error.innerText = "همه فیلدها الزامی هستند!";
    return;
  }

  fetch(`/auth/${mode}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ username, password })
  })
  .then(res => {
    if (!res.ok) throw new Error("خطا در احراز هویت");
    return res.json();
  })
  .then(data => {
    localStorage.setItem("user", JSON.stringify(data));
    window.opener.location.href = "/profile.html";
    window.close();
  })
  .catch(() => error.innerText = "نام کاربری یا رمز عبور اشتباه است!");
}
