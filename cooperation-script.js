document.addEventListener("DOMContentLoaded", () => {
  // 🎵 کنترل موزیک
  const audio = document.getElementById("bgMusic");
  const toggleBtn = document.getElementById("audioToggle");

  toggleBtn.addEventListener("click", () => {
    if (audio.paused) {
      audio.play();
      toggleBtn.innerHTML = "⏸️";
    } else {
      audio.pause();
      toggleBtn.innerHTML = "🎵";
    }
  });

  toggleBtn.innerHTML = "🎵"; // حالت اولیه

  // ✅ ارسال فرم همکاری با اعتبارسنجی
  const form = document.getElementById("cooperationForm");
  const formMessage = document.getElementById("formMessage");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const data = {
      fullname: formData.get("fullname").trim(),
      phone: formData.get("phone").trim(),
      type: formData.get("type").trim(),
      location: formData.get("location").trim(),
      description: formData.get("description")?.trim() || ""
    };

    // بررسی فیلدهای الزامی
    if (!data.fullname || !data.phone || !data.type || !data.location) {
      formMessage.textContent = "لطفاً همه فیلدهای الزامی را پر کنید.";
      formMessage.style.color = "red";
      return;
    }

    try {
      const res = await fetch("/cooperation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      const result = await res.json();

      if (res.ok) {
        formMessage.textContent = result.message;
        formMessage.style.color = "green";
        form.reset();
      } else {
        formMessage.textContent = result.error || "خطایی رخ داده است.";
        formMessage.style.color = "red";
      }
    } catch (err) {
      console.error("❌ خطا:", err);
      formMessage.textContent = "ارتباط با سرور برقرار نشد.";
      formMessage.style.color = "red";
    }
  });
});

// 💖 انیمیشن قلب‌ها
window.addEventListener("load", () => {
  const canvas = document.getElementById("heartCanvas");
  const ctx = canvas.getContext("2d");
  let hearts = [];

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function createHeart() {
    const x = Math.random() * canvas.width;
    const y = canvas.height + 10;
    const size = Math.random() * 6 + 4;
    const speed = Math.random() * 1 + 0.5;
    const opacity = Math.random() * 0.5 + 0.5;
    return { x, y, size, speed, opacity };
  }

  function drawHeart(h) {
    ctx.save();
    ctx.globalAlpha = h.opacity;
    ctx.fillStyle = "#ec407a";
    ctx.beginPath();
    ctx.moveTo(h.x, h.y);
    ctx.bezierCurveTo(h.x + h.size / 2, h.y - h.size, h.x + h.size * 2, h.y + h.size / 3, h.x, h.y + h.size * 2);
    ctx.bezierCurveTo(h.x - h.size * 2, h.y + h.size / 3, h.x - h.size / 2, h.y - h.size, h.x, h.y);
    ctx.fill();
    ctx.restore();
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hearts = hearts.filter(h => h.y + h.size * 2 > 0);
    for (const h of hearts) {
      h.y -= h.speed;
      drawHeart(h);
    }
    if (Math.random() < 0.05) hearts.push(createHeart());
    requestAnimationFrame(animate);
  }

  resizeCanvas();
  animate();
  window.addEventListener("resize", resizeCanvas);
});
