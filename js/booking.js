// Данные услуг
const services = [
  {
    id: "recording",
    name: "Запись вокала",
    description: "Профессиональная запись с звукорежиссёром",
    price: 2500,
    icon: "fa-microphone",
  },
  {
    id: "mixing",
    name: "Сведение",
    description: "Многоканальное сведение трека",
    price: 5000,
    icon: "fa-sliders",
  },
  {
    id: "mastering",
    name: "Мастеринг",
    description: "Финальная обработка трека",
    price: 3000,
    icon: "fa-wave-square",
  },
  {
    id: "full",
    name: "Под ключ",
    description: "Запись + сведение + мастеринг",
    price: 15000,
    icon: "fa-music",
  },
  {
    id: "rehearsal",
    name: "Репетиция",
    description: "Аренда студии для репетиции",
    price: 1500,
    icon: "fa-guitar",
  },
];

// Настройки бота
const BOT_TOKEN = "ТВОЙ_ТОКЕН_СЮДА";
const ADMIN_CHAT_ID = "ТВОЙ_CHAT_ID_СЮДА";

let currentDate = new Date();
let selectedDate = null;

// Получаем выбранную услугу из URL
const urlParams = new URLSearchParams(window.location.search);
const selectedServiceId = urlParams.get("service");

// ===== ВАЛИДАЦИЯ =====
function validateField(fieldId, condition) {
  const field = document.getElementById(fieldId);
  const formGroup = field.closest(".form-group");

  if (!condition) {
    formGroup.classList.add("error");
    return false;
  } else {
    formGroup.classList.remove("error");
    return true;
  }
}

function clearErrorOnInput(fieldId) {
  const field = document.getElementById(fieldId);
  field.addEventListener("input", () =>
    field.closest(".form-group").classList.remove("error"),
  );
  field.addEventListener("change", () =>
    field.closest(".form-group").classList.remove("error"),
  );
}

// ===== ЗАПОЛНЕНИЕ ВРЕМЕНИ =====
function fillTimeSlots() {
  const timeSelect = document.getElementById("timeSelect");
  timeSelect.innerHTML = '<option value="">Выберите время...</option>';

  for (let hour = 10; hour <= 22; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
      const option = document.createElement("option");
      option.value = time;
      option.textContent = time;
      timeSelect.appendChild(option);
    }
  }
}

// ===== ФОРМАТИРОВАНИЕ ДАТЫ =====
function formatDateInput(input) {
  let value = input.value.replace(/\D/g, "");
  if (value.length > 8) value = value.slice(0, 8);
  if (value.length > 4) value = value.slice(0, 4) + "." + value.slice(4);
  if (value.length > 2) value = value.slice(0, 2) + "." + value.slice(2);
  input.value = value;
  if (value.length === 10) validateManualDate(value);
}

function validateManualDate(dateStr) {
  const parts = dateStr.split(".");
  const day = parseInt(parts[0]);
  const month = parseInt(parts[1]) - 1;
  const year = parseInt(parts[2]);
  const date = new Date(year, month, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (date < today || date.getFullYear() > 2026) {
    const field = document.getElementById("bookingDate");
    field.closest(".form-group").classList.add("error");
    field.value = "";
    return;
  }

  selectedDate = date;
  document
    .getElementById("bookingDate")
    .closest(".form-group")
    .classList.remove("error");
  renderCalendar();
}

// ===== КАЛЕНДАРЬ =====
function renderCalendar() {
  const calendarDays = document.getElementById("calendarDays");
  const calendarMonthYear = document.getElementById("calendarMonthYear");
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const months = [
    "Январь",
    "Февраль",
    "Март",
    "Апрель",
    "Май",
    "Июнь",
    "Июль",
    "Август",
    "Сентябрь",
    "Октябрь",
    "Ноябрь",
    "Декабрь",
  ];
  calendarMonthYear.textContent = `${months[month]} ${year}`;

  const firstDay = new Date(year, month, 1);
  let startDay = firstDay.getDay();
  startDay = startDay === 0 ? 6 : startDay - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  calendarDays.innerHTML = "";

  for (let i = 0; i < startDay; i++) {
    const emptyDay = document.createElement("div");
    emptyDay.className = "calendar-day empty";
    calendarDays.appendChild(emptyDay);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let day = 1; day <= daysInMonth; day++) {
    const dayElement = document.createElement("div");
    const date = new Date(year, month, day);
    dayElement.className = "calendar-day";
    dayElement.textContent = day;

    if (date < today) dayElement.classList.add("disabled");
    if (year > 2026 || (year === 2026 && month > 11))
      dayElement.classList.add("disabled");
    if (date.getTime() === today.getTime()) dayElement.classList.add("today");

    if (
      selectedDate &&
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    ) {
      dayElement.classList.add("selected");
    }

    if (!dayElement.classList.contains("disabled")) {
      dayElement.onclick = () => selectDate(date);
    }

    calendarDays.appendChild(dayElement);
  }
}

function selectDate(date) {
  selectedDate = date;
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear().toString(); // ← УБЕРИ .slice(2)

  const dateInput = document.getElementById("bookingDate");
  dateInput.value = `${day}.${month}.${year}`;

  dateInput.closest(".form-group").classList.remove("error");

  renderCalendar();

  const modal = document.getElementById("calendarModal");
  if (modal.classList.contains("active")) {
    modal.classList.remove("active");
  }

  if (telegramApp) telegramApp.hapticFeedback("light");
}

function changeMonth(direction) {
  currentDate.setMonth(currentDate.getMonth() + direction);
  if (currentDate.getFullYear() > 2026) currentDate = new Date(2026, 11, 1);
  if (currentDate.getFullYear() < new Date().getFullYear())
    currentDate = new Date();
  renderCalendar();
}

function toggleCalendar() {
  const modal = document.getElementById("calendarModal");
  modal.classList.toggle("active");
  if (modal.classList.contains("active")) {
    renderCalendar();
  }
}

// ===== ЦЕНА =====
function updatePrice() {
  const serviceSelect = document.getElementById("serviceSelect");
  const hoursSelect = document.getElementById("hoursSelect");
  const selectedId = serviceSelect.value;
  const hours = parseInt(hoursSelect.value) || 1;
  const totalPriceElement = document.getElementById("totalPrice");
  const priceSummary = document.getElementById("priceSummary");
  const service = services.find((s) => s.id === selectedId);

  if (service) {
    totalPriceElement.textContent = `${(service.price * hours).toLocaleString()} ₽`;
    priceSummary.style.display = "flex";
  } else {
    totalPriceElement.textContent = "0 ₽";
    priceSummary.style.display = "none";
  }
}

// ===== ОТПРАВКА =====
async function submitBooking() {
  const date = document.getElementById("bookingDate").value;
  const time = document.getElementById("timeSelect").value;
  const hours = document.getElementById("hoursSelect").value;
  const name = document.getElementById("userName").value;
  const phone = document.getElementById("userPhone").value;
  const serviceId = document.getElementById("serviceSelect").value;

  // Валидация
  let isValid = true;
  if (!validateField("serviceSelect", serviceId)) isValid = false;
  if (!validateField("bookingDate", date && date.length === 10))
    isValid = false;
  if (!validateField("timeSelect", time)) isValid = false;
  if (!validateField("userName", name && name.length >= 2)) isValid = false;
  if (!validateField("userPhone", phone && phone.length >= 10)) isValid = false;

  if (!isValid) {
    const firstError = document.querySelector(".form-group.error");
    if (firstError)
      firstError.scrollIntoView({ behavior: "smooth", block: "center" });
    if (telegramApp) telegramApp.hapticFeedback("error");
    return;
  }

  const service = services.find((s) => s.id === serviceId);
  const bookingData = {
    name,
    phone,
    serviceName: service.name,
    date,
    time,
    hours,
    totalPrice: document.getElementById("totalPrice").textContent,
    timestamp: new Date().toISOString(),
  };

  const btnBook = document.querySelector(".btn-book");
  const originalText = btnBook.innerHTML;
  btnBook.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправка...';
  btnBook.disabled = true;

  const sent = await sendToTelegram(bookingData);

  btnBook.innerHTML = originalText;
  btnBook.disabled = false;

  if (sent) {
    if (telegramApp && telegramApp.isTelegram) {
      telegramApp.hapticFeedback("success");
      telegramApp.showAlert("Заявка успешно отправлена!");
    } else {
      alert("Заявка успешно отправлена!");
    }
    clearForm();
  } else {
    showError("Не удалось отправить. Попробуйте позже.");
    localStorage.setItem("lastBooking", JSON.stringify(bookingData));
  }
}

async function sendToTelegram(bookingData) {
  const message =
    `🎵 <b>НОВАЯ ЗАЯВКА — FL STUDIO</b>\n\n` +
    `👤 <b>Имя:</b> ${bookingData.name}\n` +
    `📞 <b>Телефон:</b> ${bookingData.phone}\n\n` +
    `🎤 <b>Услуга:</b> ${bookingData.serviceName}\n` +
    `💰 <b>Стоимость:</b> ${bookingData.totalPrice}\n\n` +
    `📅 <b>Дата:</b> ${bookingData.date}\n` +
    `⏰ <b>Время:</b> ${bookingData.time}\n` +
    `⏱ <b>Часов:</b> ${bookingData.hours}\n\n` +
    `🕐 <b>Отправлено:</b> ${new Date().toLocaleString("ru-RU")}`;

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: ADMIN_CHAT_ID,
        text: message,
        parse_mode: "HTML",
      }),
    });
    const data = await response.json();
    return data.ok;
  } catch (error) {
    console.error("Ошибка отправки:", error);
    return false;
  }
}

function showError(message) {
  if (telegramApp && telegramApp.isTelegram) {
    telegramApp.showAlert(message);
    telegramApp.hapticFeedback("error");
  } else {
    alert(message);
  }
}

function clearForm() {
  document.getElementById("serviceSelect").value = "";
  document.getElementById("bookingDate").value = "";
  document.getElementById("timeSelect").value = "";
  document.getElementById("hoursSelect").value = "1";
  document.getElementById("userPhone").value = "";
  selectedDate = null;
  updatePrice();
}

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener("DOMContentLoaded", () => {
  fillTimeSlots();
  renderCalendar();

  if (selectedServiceId) {
    document.getElementById("serviceSelect").value = selectedServiceId;
    updatePrice();
  }

  // Очистка ошибок при вводе
  [
    "serviceSelect",
    "bookingDate",
    "timeSelect",
    "userName",
    "userPhone",
  ].forEach(clearErrorOnInput);

  // Маска телефона
  const phoneInput = document.getElementById("userPhone");
  phoneInput.addEventListener("input", (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.startsWith("7") || value.startsWith("8")) value = value.slice(1);
    let formatted = "+7 (";
    if (value.length > 0) formatted += value.slice(0, 3);
    if (value.length >= 3) formatted += ") " + value.slice(3, 6);
    if (value.length >= 6) formatted += "-" + value.slice(6, 8);
    if (value.length >= 8) formatted += "-" + value.slice(8, 10);
    e.target.value = formatted;
  });
});
