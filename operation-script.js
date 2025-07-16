document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("cooperationForm");
  const msg = document.getElementById("formMessage");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.textContent = "در حال ارسال اطلاعات...";

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/cooperation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (response.ok) {
        msg.textContent = "✅ فرم همکاری با موفقیت ثبت شد. به زودی با شما تماس می‌گیریم.";
        form.reset();
      } else {
        msg.textContent = "❌ خطا در ارسال فرم: " + (result.error || "لطفاً دوباره تلاش کنید.");
      }
    } catch (error) {
      msg.textContent = "⛔️ خطا در ارتباط با سرور.";
    }
  });
});

function toggleMusic() {
  const music = document.getElementById("bgMusic");
  if (music.paused) music.play();
  else music.pause();
}
