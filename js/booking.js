// ===== ДАННЫЕ =====
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

// ===== НАСТРОЙКИ =====
const WORKER_URL = "https://flstudio-bot.flstudio.workers.dev";
const DISCOUNT_PERCENT = 30;

let currentDate = new Date();
let selectedDate = null;
let bookedDates = [];

const urlParams = new URLSearchParams(window.location.search);
const selectedServiceId = urlParams.get("service");

// ===== ВАЛИДАЦИЯ =====
function validateField(fieldId, condition) {
  const field = document.getElementById(fieldId);
  const formGroup = field.closest(".form-group");
  if (!condition) {
    formGroup.classList.add("error");
    return false;
  }
  formGroup.classList.remove("error");
  return true;
}

function clearErrorOnInput(fieldId) {
  const field = document.getElementById(fieldId);
  const clear = () => field.closest(".form-group").classList.remove("error");
  field.addEventListener("input", clear);
  field.addEventListener("change", clear);
}

// ===== ВРЕМЯ =====
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

// ===== ДАТА =====
function formatDateInput(input) {
  let value = input.value.replace(/\D/g, "");
  if (value.length > 8) value = value.slice(0, 8);
  if (value.length > 4) value = value.slice(0, 4) + "." + value.slice(4);
  if (value.length > 2) value = value.slice(0, 2) + "." + value.slice(2);
  input.value = value;
  if (value.length === 10) validateManualDate(value);
}

function validateManualDate(dateStr) {
  const [day, month, year] = dateStr.split(".").map(Number);
  const date = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const field = document.getElementById("bookingDate");
  if (date < today || year > 2026) {
    field.closest(".form-group").classList.add("error");
    field.value = "";
    return;
  }
  if (bookedDates.includes(dateStr)) {
    field.closest(".form-group").classList.add("error");
    field.value = "";
    showError("Эта дата уже занята");
    return;
  }
  selectedDate = date;
  field.closest(".form-group").classList.remove("error");
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

    const dateStr = `${day.toString().padStart(2, "0")}.${(month + 1).toString().padStart(2, "0")}.${year}`;
    const isBooked = bookedDates.includes(dateStr);
    const isPast = date < today;
    const isFutureLimit = year > 2026 || (year === 2026 && month > 11);

    if (isPast || isFutureLimit || isBooked)
      dayElement.classList.add("disabled");
    if (isBooked) dayElement.classList.add("booked");
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
  const year = date.getFullYear().toString();

  const dateInput = document.getElementById("bookingDate");
  dateInput.value = `${day}.${month}.${year}`;
  dateInput.closest(".form-group").classList.remove("error");

  renderCalendar();

  const modal = document.getElementById("calendarModal");
  if (modal.classList.contains("active")) modal.classList.remove("active");

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
  if (modal.classList.contains("active")) renderCalendar();
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
    const originalPrice = service.price * hours;
    const discountActive = localStorage.getItem("discountActive") === "true";

    if (discountActive) {
      const discountedPrice = Math.round(
        originalPrice * (1 - DISCOUNT_PERCENT / 100),
      );
      totalPriceElement.textContent = `${discountedPrice.toLocaleString()} ₽`;
    } else {
      totalPriceElement.textContent = `${originalPrice.toLocaleString()} ₽`;
    }
    priceSummary.style.display = "flex";
  } else {
    totalPriceElement.textContent = "0 ₽";
    priceSummary.style.display = "none";
  }
}

// ===== ОТПРАВКА =====
async function sendToTelegram(bookingData) {
  try {
    const response = await fetch(`${WORKER_URL}/api/booking`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bookingData),
    });
    const data = await response.json();
    return data.ok;
  } catch (error) {
    console.error("Ошибка:", error);
    return false;
  }
}

async function loadBookedDates() {
  try {
    const response = await fetch(`${WORKER_URL}/api/booked-dates`);
    const data = await response.json();
    return data.dates || [];
  } catch (error) {
    return [];
  }
}

async function submitBooking() {
  const date = document.getElementById("bookingDate").value;
  const time = document.getElementById("timeSelect").value;
  const hours = document.getElementById("hoursSelect").value;
  const name = document.getElementById("userName").value;
  const phone = document.getElementById("userPhone").value;
  const serviceId = document.getElementById("serviceSelect").value;

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
  const hoursNum = parseInt(hours);
  const originalPrice = service.price * hoursNum;
  const discountActive = localStorage.getItem("discountActive") === "true";
  const finalPrice = discountActive
    ? Math.round(originalPrice * (1 - DISCOUNT_PERCENT / 100))
    : originalPrice;

  const bookingData = {
    name,
    phone,
    serviceName: service.name,
    date,
    time,
    hours,
    totalPrice: `${finalPrice.toLocaleString()} ₽`,
    originalPrice: `${originalPrice.toLocaleString()} ₽`,
    discountApplied: discountActive ? `-${DISCOUNT_PERCENT}%` : "Нет",
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
    }
    showSuccess(date);
    clearForm();
  } else {
    showError("Не удалось отправить. Попробуйте позже.");
    localStorage.setItem("lastBooking", JSON.stringify(bookingData));
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
document.addEventListener("DOMContentLoaded", async () => {
  fillTimeSlots();

  bookedDates = await loadBookedDates();
  renderCalendar();

  if (selectedServiceId) {
    document.getElementById("serviceSelect").value = selectedServiceId;
    updatePrice();
  }

  [
    "serviceSelect",
    "bookingDate",
    "timeSelect",
    "userName",
    "userPhone",
  ].forEach(clearErrorOnInput);

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

// ===== УВЕДОМЛЕНИЕ ОБ УСПЕХЕ =====
function showSuccess(date) {
  const overlay = document.getElementById("successOverlay");
  const dateSpan = document.getElementById("successDate");
  if (!overlay) return;

  if (dateSpan) dateSpan.textContent = date;
  overlay.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeSuccess() {
  const overlay = document.getElementById("successOverlay");
  if (!overlay) return;
  overlay.classList.remove("active");
  document.body.style.overflow = "";
}
