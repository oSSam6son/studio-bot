// ===== ДАННЫЕ =====
const services = [
  {
    id: "recording",
    name: "Запись вокала",
    description: "Профессиональная запись с звукорежиссёром",
    price: 2500,
    icon: "fa-microphone",
    bookingType: "hourly",
  },
  {
    id: "mixing",
    name: "Сведение",
    description: "Многоканальное сведение трека",
    price: 5000,
    icon: "fa-sliders",
    bookingType: "none",
  },
  {
    id: "mastering",
    name: "Мастеринг",
    description: "Финальная обработка трека",
    price: 3000,
    icon: "fa-wave-square",
    bookingType: "none",
  },
  {
    id: "full",
    name: "Под ключ",
    description: "Запись + сведение + мастеринг",
    price: 15000,
    icon: "fa-music",
    bookingType: "hourly",
    defaultHours: 2,
  },
  {
    id: "rehearsal",
    name: "Репетиция",
    description: "Аренда студии для репетиции",
    price: 1500,
    icon: "fa-guitar",
    bookingType: "hourly",
  },
];

// ===== НАСТРОЙКИ =====
const WORKER_URL = "https://flstudio-bot.flstudio.workers.dev";
const DISCOUNT_PERCENT = 30;
const TOTAL_HOURS = 24; // 00:00 - 23:00

let currentDate = new Date();
let selectedDate = null;
let selectedTime = "";
let bookedSlots = {}; // { "23.09.2026": ["12:00", "13:00"] }
let currentBookingType = "hourly"; // hourly | none

const urlParams = new URLSearchParams(window.location.search);
const selectedServiceId = urlParams.get("service");

// ===== ВАЛИДАЦИЯ =====
function validateField(fieldId, condition) {
  const field = document.getElementById(fieldId);
  if (!field) return true;
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
  if (!field) return;
  const clear = () => field.closest(".form-group")?.classList.remove("error");
  field.addEventListener("input", clear);
  field.addEventListener("change", clear);
}

// ===== ВРЕМЯ =====
function getAllHoursRange() {
  const hours = [];
  for (let h = 0; h < 24; h++) {
    hours.push(`${h.toString().padStart(2, "0")}:00`);
  }
  return hours;
}

// ===== ДАТА =====
function openCalendar() {
  // На мобильном — открывает модалку
  // На десктопе — модалка уже показана (справа)
  if (window.innerWidth <= 768) {
    const modal = document.getElementById("calendarModal");
    if (modal) {
      modal.classList.add("active");
      renderCalendar();
    }
  }
  if (telegramApp) telegramApp.hapticFeedback("light");
}

// ===== КАЛЕНДАРЬ =====
function renderCalendar() {
  const calendarDays = document.getElementById("calendarDays");
  const calendarMonthYear = document.getElementById("calendarMonthYear");
  if (!calendarDays || !calendarMonthYear) return;

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
    const occupiedHours = bookedSlots[dateStr] || [];
    const isFullyBooked = occupiedHours.length >= TOTAL_HOURS;
    const isPartiallyBooked = occupiedHours.length > 0 && !isFullyBooked;
    const isPast = date < today;
    const isFutureLimit = year > 2026 || (year === 2026 && month > 11);

    if (isPast || isFutureLimit || isFullyBooked)
      dayElement.classList.add("disabled");
    if (isFullyBooked) dayElement.classList.add("booked");
    if (isPartiallyBooked) dayElement.classList.add("partially-booked");
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

  const dateStr = `${day}.${month}.${year}`;
  const dateInput = document.getElementById("bookingDate");
  dateInput.value = dateStr;
  dateInput.closest(".form-group").classList.remove("error");

  // Сбрасываем выбранное время при смене даты
  resetSelectedTime();

  renderCalendar();

  const modal = document.getElementById("calendarModal");
  if (modal && modal.classList.contains("active")) {
    if (window.innerWidth <= 768) {
      modal.classList.remove("active");
    }
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

function toggleCalendar(event) {
  if (event) event.stopPropagation();
  const modal = document.getElementById("calendarModal");
  if (!modal) return;

  // На мобильном — переключаем модалку
  if (window.innerWidth <= 768) {
    modal.classList.toggle("active");
    if (modal.classList.contains("active")) renderCalendar();
  }
  // На десктопе — ничего (календарь уже справа)
}

// Закрытие по клику вне календаря (только на мобильном)
document.addEventListener("click", (e) => {
  if (window.innerWidth > 768) return;
  const modal = document.getElementById("calendarModal");
  if (!modal || !modal.classList.contains("active")) return;

  const modalContent = modal.querySelector(".calendar-modal-content");
  if (!modalContent) return;

  const isClickOutside = !modalContent.contains(e.target);
  const isToggleBtn = e.target.closest(".calendar-toggle");
  const isDateInput = e.target.closest(".date-input-wrapper");

  if (isClickOutside && !isToggleBtn && !isDateInput) {
    modal.classList.remove("active");
  }
});

// ===== ВЫБОР ВРЕМЕНИ =====
function openTimePicker() {
  const dateStr = document.getElementById("bookingDate").value;

  if (!dateStr || dateStr.length !== 10) {
    showError("Сначала выберите дату");
    return;
  }

  const serviceId = document.getElementById("serviceSelect").value;
  if (!serviceId) {
    showError("Сначала выберите услугу");
    return;
  }

  // Рисуем селектор часов
  renderDurationOptions();

  // Рисуем сетку часов
  renderTimePicker(dateStr);

  const overlay = document.getElementById("timePickerOverlay");
  if (!overlay) return;
  overlay.classList.add("active");
  document.body.style.overflow = "hidden";

  if (telegramApp) telegramApp.hapticFeedback("light");
}

function renderDurationOptions() {
  const container = document.getElementById("durationOptions");
  const wrapper = document.getElementById("durationWrapper");
  if (!container || !wrapper) return;

  const serviceId = document.getElementById("serviceSelect").value;
  const service = services.find((s) => s.id === serviceId);

  // Если defaultHours — скрываем селектор, ставим значение
  if (service && service.defaultHours) {
    wrapper.style.display = "none";
    document.getElementById("hoursSelect").value = service.defaultHours;
    return;
  }

  wrapper.style.display = "flex";

  const durations = [1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12];
  const current = parseInt(document.getElementById("hoursSelect").value) || 1;

  container.innerHTML = "";

  durations.forEach((h) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "duration-btn" + (h === current ? " active" : "");
    btn.textContent = `${h} ч`;
    btn.onclick = () => selectDuration(h);
    container.appendChild(btn);
  });
}

function selectDuration(hours) {
  const hoursInput = document.getElementById("hoursSelect");
  hoursInput.value = hours;

  // Обновляем активную кнопку
  document.querySelectorAll(".duration-btn").forEach((btn) => {
    btn.classList.remove("active");
  });
  const activeBtn = Array.from(document.querySelectorAll(".duration-btn")).find(
    (btn) => btn.textContent === `${hours} ч`,
  );
  if (activeBtn) activeBtn.classList.add("active");

  // Сбрасываем выбранное время
  if (selectedTime) {
    resetSelectedTime();
  }

  // Обновляем цену
  updatePrice();

  // Перерисовываем сетку часов
  const dateStr = document.getElementById("bookingDate").value;
  if (dateStr && dateStr.length === 10) {
    renderTimePicker(dateStr);
  }

  if (telegramApp) telegramApp.hapticFeedback("light");
}

function closeTimePicker(event, force = false) {
  if (!force && event && event.target !== event.currentTarget) return;

  const overlay = document.getElementById("timePickerOverlay");
  if (!overlay) return;
  overlay.classList.remove("active");
  document.body.style.overflow = "";
}

function renderTimePicker(dateStr) {
  const grid = document.getElementById("timePickerGrid");
  if (!grid) return;

  const occupiedHours = bookedSlots[dateStr] || [];
  const hoursSelect = document.getElementById("hoursSelect");
  const requestedHours = parseInt(hoursSelect.value) || 1;

  // Обновляем дату в шапке
  const dateInfo = document.getElementById("timePickerDate");
  if (dateInfo) dateInfo.textContent = dateStr;

  grid.innerHTML = "";

  for (let hour = 0; hour < 24; hour++) {
    const time = `${hour.toString().padStart(2, "0")}:00`;

    // Проверяем, можно ли забронировать
    let canBook = true;

    // Хватает ли времени до конца суток
    if (hour + requestedHours > 24) {
      canBook = false;
    } else {
      for (let i = 0; i < requestedHours; i++) {
        const checkHour = (hour + i).toString().padStart(2, "0") + ":00";
        if (occupiedHours.includes(checkHour)) {
          canBook = false;
          break;
        }
      }
    }

    const slot = document.createElement("div");
    slot.className = "time-slot " + (canBook ? "free" : "busy");
    slot.textContent = time;

    if (canBook) {
      if (time === selectedTime) slot.classList.add("selected");
      slot.onclick = () => selectTime(time);
    }

    grid.appendChild(slot);
  }
}

function selectTime(time) {
  selectedTime = time;

  const timeDisplay = document.getElementById("timeDisplay");
  if (timeDisplay) {
    timeDisplay.textContent = time;
    timeDisplay.classList.add("has-value");
  }

  const timeInput = document.getElementById("timeSelect");
  if (timeInput) timeInput.value = time;

  const timeField = document.getElementById("timeField");
  if (timeField) timeField.classList.remove("error");

  closeTimePicker(null, true);

  if (telegramApp) telegramApp.hapticFeedback("light");
}

function resetSelectedTime() {
  selectedTime = "";
  const timeDisplay = document.getElementById("timeDisplay");
  if (timeDisplay) {
    timeDisplay.textContent = "Выберите время...";
    timeDisplay.classList.remove("has-value");
  }
  const timeInput = document.getElementById("timeSelect");
  if (timeInput) timeInput.value = "";
}

// ===== ЦЕНА =====
function updatePrice() {
  const serviceSelect = document.getElementById("serviceSelect");
  const hoursSelect = document.getElementById("hoursSelect");
  const selectedId = serviceSelect.value;
  const service = services.find((s) => s.id === selectedId);
  const totalPriceElement = document.getElementById("totalPrice");
  const priceSummary = document.getElementById("priceSummary");
  const priceDiscount = document.getElementById("priceDiscount");
  const priceOld = document.getElementById("priceOld");

  if (!service) {
    if (priceOld) priceOld.style.display = "none";
    if (totalPriceElement) totalPriceElement.textContent = "0 ₽";
    if (priceSummary) priceSummary.style.display = "none";
    if (priceDiscount) priceDiscount.style.display = "none";
    return;
  }

  // Для услуги без выбора часов — цена фиксированная
  let hours = parseInt(hoursSelect.value) || 1;
  if (service.bookingType === "none") hours = 1;
  if (service.defaultHours) hours = service.defaultHours;

  const originalPrice = service.price * hours;
  const discountActive = isDiscountActive();

  if (discountActive) {
    if (priceOld) {
      priceOld.textContent = `${originalPrice.toLocaleString()} ₽`;
      priceOld.style.display = "inline";
    }
    const discountedPrice = Math.round(
      originalPrice * (1 - DISCOUNT_PERCENT / 100),
    );
    totalPriceElement.textContent = `${discountedPrice.toLocaleString()} ₽`;
    if (priceDiscount) priceDiscount.style.display = "inline-flex";
  } else {
    if (priceOld) priceOld.style.display = "none";
    totalPriceElement.textContent = `${originalPrice.toLocaleString()} ₽`;
    if (priceDiscount) priceDiscount.style.display = "none";
  }

  priceSummary.style.display = "flex";
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

async function loadBookedDatesInBackground() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${WORKER_URL}/api/booked-dates`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const data = await response.json();
    bookedSlots = data.bookings || {};

    localStorage.setItem("bookedSlots", JSON.stringify(bookedSlots));
    renderCalendar();

    console.log("bookedSlots загружен:", bookedSlots);
  } catch (error) {
    console.warn("Ошибка загрузки дат:", error.message);

    const cached = localStorage.getItem("bookedSlots");
    if (cached) {
      try {
        bookedSlots = JSON.parse(cached);
        renderCalendar();
      } catch (e) {}
    }
  }
}

async function submitBooking() {
  const serviceId = document.getElementById("serviceSelect").value;
  const phone = document.getElementById("userPhone").value;
  const name =
    document.getElementById("userName").value ||
    (telegramApp?.isTelegram ? telegramApp.getUserName() : "") ||
    "";

  const service = services.find((s) => s.id === serviceId);

  // ===== ВАЛИДАЦИЯ =====
  let isValid = true;

  if (!validateField("serviceSelect", serviceId)) isValid = false;

  // Если услуга требует дату (hourly)
  if (service && service.bookingType !== "none") {
    const date = document.getElementById("bookingDate").value;
    if (!validateField("bookingDate", date && date.length === 10))
      isValid = false;
  }

  // Если услуга hourly и БЕЗ defaultHours — требуется время
  if (service && service.bookingType === "hourly" && !service.defaultHours) {
    const time = document.getElementById("timeSelect").value;
    if (!validateField("timeField", time && time.length > 0)) isValid = false;
  }

  // Если услуга hourly с defaultHours — время НЕ требуется, но занимается 2ч с указанного времени
  if (service && service.bookingType === "hourly" && service.defaultHours) {
    const time = document.getElementById("timeSelect").value;
    if (!validateField("timeField", time && time.length > 0)) isValid = false;
  }

  const nameField = document.getElementById("nameField");
  const isNameFieldVisible =
    nameField && !nameField.classList.contains("hidden-in-tg");
  if (
    isNameFieldVisible &&
    !validateField("userName", name && name.length >= 2)
  ) {
    isValid = false;
  }

  if (!validateField("userPhone", phone && phone.length >= 10)) isValid = false;

  if (!isValid) {
    const firstError = document.querySelector(".form-group.error");
    if (firstError)
      firstError.scrollIntoView({ behavior: "smooth", block: "center" });
    if (telegramApp) telegramApp.hapticFeedback("error");
    return;
  }

  // ===== СОБИРАЕМ ДАННЫЕ =====
  const date = document.getElementById("bookingDate").value || "";
  const time = document.getElementById("timeSelect").value || "";

  let hours = "1";
  if (service.bookingType === "none") {
    hours = "0";
  } else if (service.defaultHours) {
    hours = String(service.defaultHours);
  } else {
    hours = document.getElementById("hoursSelect").value;
  }

  const hoursNum = parseInt(hours);
  const originalPrice = service.price * (hoursNum || 1);
  const discountActive = isDiscountActive();
  const finalPrice = discountActive
    ? Math.round(originalPrice * (1 - DISCOUNT_PERCENT / 100))
    : originalPrice;

  const bookingData = {
    userId: telegramApp?.getUserId() || null,
    name: name || "Клиент",
    phone,
    serviceName: service.name,
    serviceId: service.id,
    bookingType: service.bookingType,
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
    showSuccess(date || service.name);
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

  resetSelectedTime();

  const nameField = document.getElementById("nameField");
  if (nameField && !nameField.classList.contains("hidden-in-tg")) {
    document.getElementById("userName").value = "";
  }

  selectedDate = null;
  updatePrice();

  // Скрываем поля даты/времени
  const dateField = document.getElementById("dateField");
  const timeField = document.getElementById("timeField");
  if (dateField) dateField.style.display = "none";
  if (timeField) timeField.style.display = "none";
}

function onServiceSelect() {
  const serviceId = document.getElementById("serviceSelect").value;
  const bookingWrapper = document.getElementById("bookingWrapper");
  const dateField = document.getElementById("dateField");
  const timeField = document.getElementById("timeField");
  const hoursSelect = document.getElementById("hoursSelect");

  if (!bookingWrapper) return;

  if (!serviceId) {
    // Ничего не выбрано — скрываем всё
    bookingWrapper.classList.remove("has-calendar");
    if (dateField) dateField.style.display = "none";
    if (timeField) timeField.style.display = "none";
    resetSelectedTime();
    updatePrice();
    return;
  }

  const service = services.find((s) => s.id === serviceId);
  if (!service) return;

  currentBookingType = service.bookingType;

  // Сбрасываем выбранные дату/время при смене услуги
  document.getElementById("bookingDate").value = "";
  resetSelectedTime();
  selectedDate = null;

  if (service.bookingType === "none") {
    // Услуга без даты/времени — скрываем всё
    bookingWrapper.classList.remove("has-calendar");
    if (dateField) dateField.style.display = "none";
    if (timeField) timeField.style.display = "none";
  } else if (service.bookingType === "hourly") {
    // Показываем дату и время
    if (dateField) dateField.style.display = "block";
    if (timeField) timeField.style.display = "block";
    bookingWrapper.classList.add("has-calendar");

    // Если есть defaultHours — ставим их
    if (service.defaultHours) {
      hoursSelect.value = service.defaultHours;
    } else {
      hoursSelect.value = "1";
    }
  }

  renderCalendar();
  updatePrice();

  if (telegramApp) telegramApp.hapticFeedback("light");
}

// ===== УВЕДОМЛЕНИЕ ОБ УСПЕХЕ =====
function showSuccess(text) {
  const overlay = document.getElementById("successOverlay");
  if (!overlay) return;

  overlay.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeSuccess() {
  const overlay = document.getElementById("successOverlay");
  if (!overlay) return;
  overlay.classList.remove("active");
  document.body.style.overflow = "";
}

function isDiscountActive() {
  const userId = telegramApp?.getUserId();

  if (userId) {
    const confirmed = localStorage.getItem(`user_confirmed_${userId}`);
    return confirmed !== "true";
  }

  return localStorage.getItem("discountActive") === "true";
}

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener("DOMContentLoaded", async () => {
  renderCalendar();

  // ===== ИМЯ ИЗ TELEGRAM =====
  const nameField = document.getElementById("nameField");
  const userNameInput = document.getElementById("userName");

  if (telegramApp && telegramApp.isTelegram) {
    const tgName = telegramApp.getUserName();
    console.log("Telegram user:", telegramApp.tg.initDataUnsafe?.user);
    console.log("Полученное имя:", tgName);

    if (tgName && nameField && userNameInput) {
      nameField.classList.add("hidden-in-tg");
      userNameInput.value = tgName;

      let badge = document.querySelector(".user-badge");
      if (!badge) {
        badge = document.createElement("div");
        badge.className = "user-badge visible";
        nameField.parentNode.insertBefore(badge, nameField);
      }
      badge.innerHTML = `<i class="fas fa-user-check"></i><span>${tgName}</span>`;
    }
  }

  // Если услуга пришла в URL
  if (selectedServiceId) {
    document.getElementById("serviceSelect").value = selectedServiceId;
    onServiceSelect();
  }

  ["serviceSelect", "bookingDate", "userName", "userPhone"].forEach(
    clearErrorOnInput,
  );

  // ===== МАСКА ТЕЛЕФОНА =====
  const phoneInput = document.getElementById("userPhone");

  if (phoneInput) {
    phoneInput.addEventListener("input", (e) => {
      const input = e.target;
      let digits = input.value.replace(/\D/g, "");

      if (digits.startsWith("7") || digits.startsWith("8")) {
        digits = digits.slice(1);
      }

      digits = digits.slice(0, 10);

      if (digits.length === 0) {
        input.value = "";
        input.closest(".form-group")?.classList.remove("error");
        return;
      }

      let formatted = "+7";
      if (digits.length > 0) formatted += " (" + digits.slice(0, 3);
      if (digits.length >= 3) formatted += ")";
      if (digits.length > 3) formatted += " " + digits.slice(3, 6);
      if (digits.length > 6) formatted += "-" + digits.slice(6, 8);
      if (digits.length > 8) formatted += "-" + digits.slice(8, 10);

      input.value = formatted;
      input.setSelectionRange(formatted.length, formatted.length);
      input.closest(".form-group")?.classList.remove("error");
    });
  }

  // Фоновая загрузка дат
  loadBookedDatesInBackground();
});
