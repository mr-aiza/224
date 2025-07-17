document.getElementById("openPopup").onclick = () => {
  document.getElementById("authPopup").classList.remove("hidden");
};

document.getElementById("registerBtn").onclick = async () => {
  const name = document.getElementById("nameInput").value;
  const phone = document.getElementById("phoneInput").value;
  const password = document.getElementById("passwordInput").value;

  const res = await fetch('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, phone, password }),
  });

  const data = await res.json();
  document.getElementById("authMsg").innerText = data.message;
};

document.getElementById("loginBtn").onclick = async () => {
  const phone = document.getElementById("phoneInput").value;
  const password = document.getElementById("passwordInput").value;

  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, password }),
  });

  const data = await res.json();
  document.getElementById("authMsg").innerText = data.message;

  if (res.ok) {
    localStorage.setItem("token", data.token);
    document.getElementById("authPopup").classList.add("hidden");
    document.getElementById("profile").classList.remove("hidden");
    document.getElementById("userName").innerText = data.name;
  }
};

function logout() {
  localStorage.removeItem("token");
  location.reload();
}
