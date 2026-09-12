const WORKER_URL = "https://flstudio-bot.flstudio.workers.dev";
const ADMIN_PASSWORD = "1234";

// ===== АВТОРИЗАЦИЯ =====
function checkPassword() {
  const input = document.getElementById("adminPassword");
  const password = input.value.trim();

  if (password === ADMIN_PASSWORD) {
    sessionStorage.setItem("adminAuth", "true");
    showPanel();
  } else {
    input.value = "";
    input.placeholder = "Неверный пароль!";
    input.style.borderColor = "#ff4444";
    setTimeout(() => {
      input.placeholder = "Введите пароль";
      input.style.borderColor = "";
    }, 2000);
  }
}

function logout() {
  sessionStorage.removeItem("adminAuth");
  document.getElementById("adminPanel").style.display = "none";
  document.getElementById("adminLogin").style.display = "block";
  document.getElementById("adminPassword").value = "";
}

function showPanel() {
  document.getElementById("adminLogin").style.display = "none";
  document.getElementById("adminPanel").style.display = "block";
  loadDates();
}

// Enter для входа
document.addEventListener("DOMContentLoaded", () => {
  if (sessionStorage.getItem("adminAuth") === "true") {
    showPanel();
  }

  const pwInput = document.getElementById("adminPassword");
  if (pwInput) {
    pwInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") checkPassword();
    });
  }
});

// ===== ДАТЫ =====
async function loadDates() {
  const list = document.getElementById("adminDatesList");
  list.innerHTML = '<p class="admin-empty">Загрузка...</p>';

  try {
    const response = await fetch(`${WORKER_URL}/api/booked-dates`);
    const data = await response.json();
    const dates = data.dates || [];

    if (dates.length === 0) {
      list.innerHTML = '<p class="admin-empty">Нет занятых дат</p>';
      return;
    }

    // Сортируем по дате
    dates.sort((a, b) => {
      const [d1, m1, y1] = a.split(".").map(Number);
      const [d2, m2, y2] = b.split(".").map(Number);
      return new Date(y1, m1 - 1, d1) - new Date(y2, m2 - 1, d2);
    });

    list.innerHTML = "";
    dates.forEach((date) => {
      const item = document.createElement("div");
      item.className = "admin-date-item";
      item.innerHTML = `
        <span><i class="fas fa-calendar-check"></i> ${date}</span>
        <button onclick="removeDate('${date}')" class="admin-remove">
          <i class="fas fa-trash"></i>
        </button>
      `;
      list.appendChild(item);
    });
  } catch (error) {
    list.innerHTML = '<p class="admin-empty">Ошибка загрузки</p>';
    console.error(error);
  }
}

async function addDate() {
  const input = document.getElementById("adminDate");
  const date = input.value.trim();

  if (!/^\d{2}\.\d{2}\.\d{4}$/.test(date)) {
    alert("Введите дату в формате ДД.ММ.ГГГГ");
    return;
  }

  try {
    const response = await fetch(`${WORKER_URL}/api/admin/add-date`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date }),
    });
    const data = await response.json();

    if (data.ok) {
      input.value = "";
      loadDates();
    } else {
      alert("Ошибка: " + (data.error || "неизвестно"));
    }
  } catch (error) {
    alert("Ошибка сети");
    console.error(error);
  }
}

async function removeDate(date) {
  if (
    !confirm(
      `Удалить дату ${date}? Она снова станет доступной для бронирования.`,
    )
  )
    return;

  try {
    const response = await fetch(`${WORKER_URL}/api/admin/remove-date`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date }),
    });
    const data = await response.json();

    if (data.ok) {
      loadDates();
    } else {
      alert("Ошибка: " + (data.error || "неизвестно"));
    }
  } catch (error) {
    alert("Ошибка сети");
    console.error(error);
  }
}

function formatAdminDate(input) {
  let value = input.value.replace(/\D/g, "");
  if (value.length > 8) value = value.slice(0, 8);
  if (value.length > 4) value = value.slice(0, 4) + "." + value.slice(4);
  if (value.length > 2) value = value.slice(0, 2) + "." + value.slice(2);
  input.value = value;
}
