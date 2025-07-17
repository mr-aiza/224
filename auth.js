const authBtn = document.getElementById("authBtn");
const authModal = document.getElementById("authModal");
const closeModal = document.getElementById("closeModal");

authBtn.onclick = () => authModal.style.display = "block";
closeModal.onclick = () => authModal.style.display = "none";
window.onclick = e => { if (e.target === authModal) authModal.style.display = "none"; };

function toggleForm(type) {
  document.getElementById("loginForm").style.display = type === 'login' ? 'block' : 'none';
  document.getElementById("registerForm").style.display = type === 'register' ? 'block' : 'none';
}

// ثبت‌نام
document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("registerUsername").value;
  const password = document.getElementById("registerPassword").value;

  const res = await fetch("/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json();
  alert(data.message);
  if (res.ok) toggleForm("login");
});

// ورود
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("loginUsername").value;
  const password = document.getElementById("loginPassword").value;

  const res = await fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json();
  if (res.ok) {
    localStorage.setItem("user", username);
    showProfile();
    authModal.style.display = "none";
  } else {
    alert(data.message);
  }
});

function showProfile() {
  const user = localStorage.getItem("user");
  if (user) {
    document.getElementById("welcomeMsg").innerText = `سلام ${user} عزیز!`;
    document.getElementById("authBtn").style.display = "none";
    document.getElementById("profileBox").style.display = "block";
  }
}

function logout() {
  localStorage.removeItem("user");
  location.reload();
}

showProfile();
