const WORKER_URL = "";

// Все 24 часа (00:00 - 23:00)
const ALL_HOURS = [];
for (let h = 0; h < 24; h++) {
  ALL_HOURS.push(`${h.toString().padStart(2, "0")}:00`);
}

// ===== АВТОРИЗАЦИЯ =====
// ⭐ Пароль шлём В BODY (не в заголовке) → нет preflight → работает без VPN

function getAdminPassword() {
  return localStorage.getItem("adminPassword") || "";
}

// ⭐ Универсальный POST без кастомных заголовков (Content-Type: text/plain — простой запрос)
async function adminPost(path, payload) {
  const response = await fetch(`${WORKER_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({
      ...payload,
      password: getAdminPassword(),
    }),
  });
  return response;
}

// ⭐ Универсальный GET — пароль в query string
async function adminGet(path) {
  const url = `${WORKER_URL}${path}?password=${encodeURIComponent(getAdminPassword())}`;
  return fetch(url);
}

async function checkPassword() {
  const input = document.getElementById("adminPassword");
  const password = input.value.trim();

  if (!password) return;

  try {
    const response = await fetch(
      `${WORKER_URL}/api/admin/check?password=${encodeURIComponent(password)}`,
    );

    if (response.ok) {
      localStorage.setItem("adminPassword", password);
      localStorage.setItem("adminAuth", "true");
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
  } catch (e) {
    input.value = "";
    input.placeholder = "Ошибка сети";
    input.style.borderColor = "#ff4444";
    setTimeout(() => {
      input.placeholder = "Введите пароль";
      input.style.borderColor = "";
    }, 2000);
  }
}

function logout() {
  localStorage.removeItem("adminAuth");
  localStorage.removeItem("adminPassword");
  document.getElementById("adminPanel").style.display = "none";
  document.getElementById("adminLogin").style.display = "block";
  document.getElementById("adminPassword").value = "";
}

function showPanel() {
  document.getElementById("adminLogin").style.display = "none";
  document.getElementById("adminPanel").style.display = "block";
  loadDates();
}

document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("adminAuth") === "true") {
    showPanel();
  }

  const pwInput = document.getElementById("adminPassword");
  if (pwInput) {
    pwInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") checkPassword();
    });
  }
});

// ===== СПИСОК ЗАНЯТЫХ ДАТ =====
async function loadDates() {
  const list = document.getElementById("adminDatesList");
  list.innerHTML = '<p class="admin-empty">Загрузка...</p>';

  try {
    // Публичный эндпоинт
    const response = await fetch(`${WORKER_URL}/api/booked-dates`);
    const data = await response.json();
    const bookings = data.bookings || {};
    const dates = Object.keys(bookings);

    if (dates.length === 0) {
      list.innerHTML = '<p class="admin-empty">Нет занятых дат</p>';
      return;
    }

    dates.sort((a, b) => {
      const [d1, m1, y1] = a.split(".").map(Number);
      const [d2, m2, y2] = b.split(".").map(Number);
      return new Date(y1, m1 - 1, d1) - new Date(y2, m2 - 1, d2);
    });

    list.innerHTML = "";

    dates.forEach((date) => {
      const busyHours = bookings[date] || [];
      const freeHours = ALL_HOURS.filter((h) => !busyHours.includes(h));
      const isFullDay = freeHours.length === 0;

      const item = document.createElement("div");
      item.className = "admin-date-item";

      const header = document.createElement("div");
      header.className = "admin-date-header";
      header.innerHTML = `
        <div class="admin-date-info">
          <i class="fas fa-calendar-check"></i>
          <span>${date}</span>
          <span class="admin-date-status ${isFullDay ? "full" : "partial"}">
            ${isFullDay ? "Полностью закрыта" : `Занято ${busyHours.length} ч.`}
          </span>
        </div>
        <div class="admin-date-actions">
          <button class="admin-toggle-hours" onclick="toggleHours('${date}')">
            <i class="fas fa-clock"></i> Часы
          </button>
          <button class="admin-remove" onclick="removeDate('${date}')">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;
      item.appendChild(header);

      const hoursPanel = document.createElement("div");
      hoursPanel.className = "admin-hours-panel";
      hoursPanel.id = `hours-${date}`;

      const hoursGrid = document.createElement("div");
      hoursGrid.className = "admin-hours-grid";

      ALL_HOURS.forEach((hour) => {
        const isBusy = busyHours.includes(hour);
        const btn = document.createElement("button");
        btn.className = `admin-hour-btn ${isBusy ? "busy" : "free"}`;
        btn.textContent = hour;
        btn.onclick = () => toggleHour(date, hour, isBusy);
        hoursGrid.appendChild(btn);
      });

      hoursPanel.appendChild(hoursGrid);
      item.appendChild(hoursPanel);

      list.appendChild(item);
    });
  } catch (error) {
    list.innerHTML = '<p class="admin-empty">Ошибка загрузки</p>';
    console.error(error);
  }
}

function toggleHours(date) {
  const panel = document.getElementById(`hours-${date}`);
  if (panel) panel.classList.toggle("active");
}

async function toggleHour(date, hour, isBusy) {
  const endpoint = isBusy ? "open-hours" : "close-hours";

  try {
    const response = await adminPost(`/api/admin/${endpoint}`, {
      date,
      hours: [hour],
    });

    if (response.status === 401) {
      localStorage.removeItem("adminAuth");
      localStorage.removeItem("adminPassword");
      window.location.href = "admin.html";
      return;
    }

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

async function closeDay() {
  const input = document.getElementById("adminDate");
  const date = input.value.trim();

  if (!/^\d{2}\.\d{2}\.\d{4}$/.test(date)) {
    alert("Введите дату в формате ДД.ММ.ГГГГ");
    return;
  }

  try {
    const response = await adminPost("/api/admin/close-day", { date });

    if (response.status === 401) {
      localStorage.removeItem("adminAuth");
      localStorage.removeItem("adminPassword");
      window.location.href = "admin.html";
      return;
    }

    const data = await response.json();

    if (data.ok) {
      input.value = "";
      await loadDates();
    } else {
      alert("Ошибка: " + (data.error || "неизвестно"));
    }
  } catch (error) {
    alert("Ошибка сети");
    console.error(error);
  }
}

async function removeDate(date) {
  if (!confirm(`Удалить ВСЕ брони на ${date}?`)) return;

  try {
    const response = await adminPost("/api/admin/remove-date", { date });

    if (response.status === 401) {
      localStorage.removeItem("adminAuth");
      localStorage.removeItem("adminPassword");
      window.location.href = "admin.html";
      return;
    }

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
