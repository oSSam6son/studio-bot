const WORKER_URL = "";
let allBookings = [];
let currentFilter = "all";
let showAll = false;
const PREVIEW_COUNT = 10;

// ⭐ Пароль в query string — простой GET без preflight
function adminGet(path) {
  const pass = localStorage.getItem("adminPassword") || "";
  return fetch(`${WORKER_URL}${path}?password=${encodeURIComponent(pass)}`);
}

document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("adminAuth") !== "true") {
    window.location.href = "admin.html";
    return;
  }
  loadHistory();
});

async function loadHistory() {
  const list = document.getElementById("historyList");
  list.innerHTML = '<p class="admin-empty">Загрузка...</p>';

  try {
    const response = await adminGet("/api/admin/bookings-history");

    if (response.status === 401) {
      localStorage.removeItem("adminAuth");
      localStorage.removeItem("adminPassword");
      window.location.href = "admin.html";
      return;
    }

    const data = await response.json();
    allBookings = data.bookings || [];
    renderHistory();
  } catch (error) {
    list.innerHTML = '<p class="admin-empty">Ошибка загрузки</p>';
    console.error(error);
  }
}

function setFilter(filter) {
  currentFilter = filter;
  showAll = false; // ⭐ сбрасываем показ при смене фильтра
  document.querySelectorAll(".admin-filter-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.filter === filter);
  });
  renderHistory();
}

function toggleShowAll() {
  showAll = !showAll;
  renderHistory();
}

function renderHistory() {
  const list = document.getElementById("historyList");
  const countEl = document.getElementById("historyCount");

  let filtered = allBookings;
  if (currentFilter !== "all") {
    filtered = allBookings.filter((b) => b.status === currentFilter);
  }

  countEl.textContent = filtered.length;

  if (filtered.length === 0) {
    list.innerHTML = '<p class="admin-empty">Нет заявок</p>';
    return;
  }

  // ⭐ Ограничиваем показ
  const visible = showAll ? filtered : filtered.slice(0, PREVIEW_COUNT);
  const hasMore = filtered.length > PREVIEW_COUNT;

  list.innerHTML = "";

  visible.forEach((booking) => {
    const item = document.createElement("div");
    item.className = "admin-history-item";

    let statusClass = "pending";
    let statusIcon = "fa-clock";
    let statusText = "Ожидает";

    if (booking.status === "confirmed") {
      statusClass = "confirmed";
      statusIcon = "fa-check";
      statusText = "Подтверждено";
    } else if (booking.status === "cancelled") {
      statusClass = "cancelled";
      statusIcon = "fa-times";
      statusText = "Отменено";
    }

    const createdDate = booking.createdAt
      ? new Date(booking.createdAt).toLocaleString("ru-RU", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

    let scheduleInfo = "";
    if (booking.bookingType === "none") {
      scheduleInfo = `<div class="admin-history-row"><i class="fas fa-info-circle"></i> Без записи на время</div>`;
    } else if (booking.date) {
      scheduleInfo = `
        <div class="admin-history-row">
          <i class="fas fa-calendar-day"></i>
          ${booking.date}${booking.time ? ` в ${booking.time}` : ""}${booking.hours ? ` (${booking.hours} ч.)` : ""}
        </div>
      `;
    }

    const userLink = booking.userId
      ? `<a href="tg://user?id=${booking.userId}" class="admin-history-user">
           <i class="fas fa-user"></i> ${booking.name || "Клиент"}
         </a>`
      : `<span class="admin-history-user"><i class="fas fa-user"></i> ${booking.name || "Клиент"}</span>`;

    item.innerHTML = `
      <div class="admin-history-header">
        <div class="admin-history-service">
          <i class="fas fa-music"></i>
          ${booking.serviceName || "Услуга"}
        </div>
        <span class="admin-history-status ${statusClass}">
          <i class="fas ${statusIcon}"></i> ${statusText}
        </span>
      </div>

      <div class="admin-history-body">
        ${userLink}
        ${booking.phone ? `<a href="tel:${booking.phone}" class="admin-history-phone"><i class="fas fa-phone"></i> ${booking.phone}</a>` : ""}
        ${scheduleInfo}
      </div>

      <div class="admin-history-footer">
        <span class="admin-history-price">
          <i class="fas fa-ruble-sign"></i> ${booking.totalPrice || "—"}
        </span>
        <span class="admin-history-date">
          <i class="fas fa-clock"></i> ${createdDate}
        </span>
      </div>
    `;

    list.appendChild(item);
  });

  // ⭐ Кнопка «Показать все» / «Свернуть»
  if (hasMore) {
    const btnWrap = document.createElement("div");
    btnWrap.className = "admin-history-showall-wrap";

    const btn = document.createElement("button");
    btn.className = "admin-history-showall";
    btn.innerHTML = showAll
      ? `<i class="fas fa-chevron-up"></i> Свернуть`
      : `<i class="fas fa-chevron-down"></i> Показать все (${filtered.length})`;
    btn.onclick = toggleShowAll;

    btnWrap.appendChild(btn);
    list.appendChild(btnWrap);
  }
}
