// 🎵 کنترل موزیک
document.addEventListener("DOMContentLoaded", () => {
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
});

// قلب‌های پس‌زمینه
  const canvas = document.getElementById('bgCanvas');
  const ctx = canvas.getContext('2d');
  let W = canvas.width = window.innerWidth;
  let H = canvas.height = window.innerHeight;

  function drawHeart(ctx, x, y, size, color) {
    ctx.save();
    ctx.beginPath();
    const topCurveHeight = size * 0.3;
    ctx.moveTo(x, y + topCurveHeight);
    ctx.bezierCurveTo(x, y, x - size / 2, y, x - size / 2, y + topCurveHeight);
    ctx.bezierCurveTo(x - size / 2, y + (size + topCurveHeight) / 2, x, y + (size + topCurveHeight) / 1.2, x, y + size);
    ctx.bezierCurveTo(x, y + (size + topCurveHeight) / 1.2, x + size / 2, y + (size + topCurveHeight) / 2, x + size / 2, y + topCurveHeight);
    ctx.bezierCurveTo(x + size / 2, y, x, y, x, y + topCurveHeight);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }

  const hearts = [];
  for (let i = 0; i < 70; i++) {
    hearts.push({
      x: Math.random() * W,
      y: Math.random() * H,
      size: Math.random() * 16 + 8,
      speedX: Math.random() * 0.5 + 0.2,
      speedY: Math.random() * 0.5 + 0.2,
      color: `rgba(236,64,122,${Math.random() * 0.4 + 0.3})`
    });
  }

  function update() {
    ctx.clearRect(0, 0, W, H);
    for (const h of hearts) {
      h.x += h.speedX;
      h.y += h.speedY;
      if (h.x > W) h.x = -h.size;
      if (h.y > H) h.y = -h.size;
      drawHeart(ctx, h.x, h.y, h.size, h.color);
    }
    requestAnimationFrame(update);
  }

  window.addEventListener('resize', () => {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  });

  update();
</script>

// ✅ ارسال فرم استخدام مهماندار با اعتبارسنجی و fetch به /waiter
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("waiterForm");
  const formMessage = document.getElementById("formMessage");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const data = {
      fullname: formData.get("fullname").trim(),
      phone: formData.get("phone").trim(),
      city: formData.get("city").trim(),
      experience: formData.get("experience").trim(),
      availability: formData.get("availability").trim(),
      description: formData.get("description")?.trim() || ""
    };

    // بررسی فیلدهای الزامی
    if (!data.fullname || !data.phone || !data.city || !data.experience || !data.availability) {
      formMessage.textContent = "لطفاً همه فیلدهای الزامی را پر کنید.";
      formMessage.style.color = "red";
      return;
    }

    try {
      const res = await fetch("/waiter", {
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
      formMessage
