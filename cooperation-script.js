document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("cooperationForm");
  const formMessage = document.getElementById("formMessage");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const data = {
      fullname: formData.get("fullname"),
      phone: formData.get("phone"),
      type: formData.get("type"),
      location: formData.get("location"),
      description: formData.get("description")
    };

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
