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
const TOTAL_HOURS = 24;

let currentDate = new Date();
let selectedDate = null;
let selectedTime = "";
let bookedSlots = {};

const urlParams = new URLSearchParams(window.location.search);
const selectedServiceId = urlParams.get("service");

// ===== УТИЛИТЫ ДАТ =====
function parseDate(dateStr) {
  const [day, month, year] = dateStr.split(".").map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(date) {
  const d = date.getDate().toString().padStart(2, "0");
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  return `${d}.${m}.${date.getFullYear()}`;
}

function addDays(date, days) {
  const r = new Date(date);
  r.setDate(r.getDate() + days);
  return r;
}

function calculateOccupiedSlots(startDateStr, startHour, hoursCount) {
  const result = {};
  const startDate = parseDate(startDateStr);

  for (let i = 0; i < hoursCount; i++) {
    const totalHour = startHour + i;
    const dayOffset = Math.floor(totalHour / 24);
    const hourInDay = totalHour % 24;

    const targetDate = addDays(startDate, dayOffset);
    const targetDateStr = formatDate(targetDate);
    const hourStr = `${hourInDay.toString().padStart(2, "0")}:00`;

    if (!result[targetDateStr]) result[targetDateStr] = [];
    result[targetDateStr].push(hourStr);
  }
  return result;
}

function checkSlotsAvailability(startDateStr, startHour, hoursCount) {
  const slots = calculateOccupiedSlots(startDateStr, startHour, hoursCount);

  for (const date in slots) {
    const occupiedHours = bookedSlots[date] || [];
    for (const hour of slots[date]) {
      if (occupiedHours.includes(hour)) {
        return { ok: false, conflict: { date, hour } };
      }
    }
  }
  return { ok: true, conflict: null };
}

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

// ===== ОШИБКИ / УСПЕХ =====
function showError(message, showContacts = false) {
  const overlay = document.getElementById("errorOverlay");
  const textEl = document.getElementById("errorText");
  const contacts = document.querySelector(".error-contacts");

  if (overlay && textEl) {
    textEl.textContent = message;
    overlay.classList.add("active");
    document.body.style.overflow = "hidden";

    if (contacts) {
      contacts.style.display = showContacts ? "block" : "none";
    }
  }

  if (telegramApp && telegramApp.isTelegram) {
    telegramApp.hapticFeedback("error");
  }
}

function closeError() {
  const overlay = document.getElementById("errorOverlay");
  if (!overlay) return;
  overlay.classList.remove("active");
  document.body.style.overflow = "";
}

function showSuccess() {
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

document.addEventListener("click", (e) => {
  const overlay = document.getElementById("errorOverlay");
  if (!overlay || !overlay.classList.contains("active")) return;
  const modal = overlay.querySelector(".error-modal");
  if (modal && !modal.contains(e.target)) closeError();
});

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
    const isPast = date < today;
    const isFutureLimit = year > 2026 || (year === 2026 && month > 11);

    if (isPast || isFutureLimit || isFullyBooked)
      dayElement.classList.add("disabled");
    if (isFullyBooked) dayElement.classList.add("booked");
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
  const dateStr = formatDate(date);

  const dateInput = document.getElementById("bookingDate");
  dateInput.value = dateStr;

  const dateField = document.getElementById("dateField");
  if (dateField) dateField.classList.remove("error");
  dateInput.closest(".form-group")?.classList.remove("error");

  resetSelectedTime();
  renderCalendar();

  const modal = document.getElementById("calendarModal");
  if (modal && modal.classList.contains("active") && window.innerWidth <= 768) {
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

function openCalendar() {
  if (window.innerWidth <= 768) {
    const modal = document.getElementById("calendarModal");
    if (modal) {
      modal.classList.add("active");
      renderCalendar();
    }
  }
  if (telegramApp) telegramApp.hapticFeedback("light");
}

function toggleCalendar(event) {
  if (event) event.stopPropagation();
  const modal = document.getElementById("calendarModal");
  if (!modal) return;
  if (window.innerWidth <= 768) {
    modal.classList.toggle("active");
    if (modal.classList.contains("active")) renderCalendar();
  }
}

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

// ===== ПОПАП ВРЕМЕНИ =====
function openTimePicker() {
  const dateStr = document.getElementById("bookingDate").value;

  if (!dateStr || dateStr.length !== 10) {
    const dateField = document.getElementById("dateField");
    if (dateField) {
      dateField.classList.add("error");
      dateField.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    if (telegramApp) telegramApp.hapticFeedback("error");
    return;
  }

  const serviceId = document.getElementById("serviceSelect").value;
  if (!serviceId) {
    const serviceField = document.getElementById("serviceSelect");
    serviceField?.closest(".form-group")?.classList.add("error");
    return;
  }

  renderDurationOptions();
  renderTimePicker(dateStr);

  const doneBtn = document.getElementById("timePickerDone");
  if (doneBtn) doneBtn.disabled = !selectedTime;

  const overlay = document.getElementById("timePickerOverlay");
  if (!overlay) return;
  overlay.classList.add("active");
  document.body.style.overflow = "hidden";

  if (telegramApp) telegramApp.hapticFeedback("light");
}

function closeTimePicker(event, force = false) {
  if (!force && event && event.target !== event.currentTarget) return;
  const overlay = document.getElementById("timePickerOverlay");
  if (!overlay) return;
  overlay.classList.remove("active");
  document.body.style.overflow = "";
}

function updateTimePickerHeader(hours) {
  const titleEl = document.querySelector(".time-picker-header h3");
  if (!titleEl) return;

  if (selectedTime) {
    const startHour = parseInt(selectedTime.split(":")[0]);
    const endHour = (startHour + hours) % 24;
    const startStr = `${startHour.toString().padStart(2, "0")}:00`;
    const endStr = `${endHour.toString().padStart(2, "0")}:00`;
    titleEl.innerHTML = `Выберите время <span class="time-picker-hours-badge">${startStr} — ${endStr}</span>`;
  } else {
    titleEl.innerHTML = `Выберите время <span class="time-picker-hours-badge">${hours} ч</span>`;
  }
}

function renderDurationOptions() {
  const container = document.getElementById("durationOptions");
  const wrapper = document.getElementById("durationWrapper");
  if (!container || !wrapper) return;

  const serviceId = document.getElementById("serviceSelect").value;
  const service = services.find((s) => s.id === serviceId);

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
  document.getElementById("hoursSelect").value = hours;

  document
    .querySelectorAll(".duration-btn")
    .forEach((btn) => btn.classList.remove("active"));
  const activeBtn = Array.from(document.querySelectorAll(".duration-btn")).find(
    (b) => b.textContent === `${hours} ч`,
  );
  if (activeBtn) activeBtn.classList.add("active");

  selectedTime = "";
  const timeInput = document.getElementById("timeSelect");
  if (timeInput) timeInput.value = "";
  const timeDisplay = document.getElementById("timeDisplay");
  if (timeDisplay) {
    timeDisplay.textContent = "Выберите время...";
    timeDisplay.classList.remove("has-value");
  }
  const doneBtn = document.getElementById("timePickerDone");
  if (doneBtn) doneBtn.disabled = true;

  updatePrice();

  const dateStr = document.getElementById("bookingDate").value;
  if (dateStr && dateStr.length === 10) {
    renderTimePicker(dateStr);
  } else {
    updateTimePickerHeader(hours);
  }

  if (telegramApp) telegramApp.hapticFeedback("light");
}

function renderTimePicker(dateStr) {
  const grid = document.getElementById("timePickerGrid");
  if (!grid) return;

  const requestedHours =
    parseInt(document.getElementById("hoursSelect").value) || 1;

  const dateInfo = document.getElementById("timePickerDate");
  if (dateInfo) dateInfo.textContent = dateStr;

  updateTimePickerHeader(requestedHours);
  grid.innerHTML = "";

  for (let hour = 0; hour < 24; hour++) {
    const time = `${hour.toString().padStart(2, "0")}:00`;
    const canBook = checkSlotsAvailability(dateStr, hour, requestedHours).ok;

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

  const requestedHours =
    parseInt(document.getElementById("hoursSelect").value) || 1;
  const startHour = parseInt(time.split(":")[0]);
  const endHour = (startHour + requestedHours) % 24;
  const rangeText = `${startHour.toString().padStart(2, "0")}:00 — ${endHour.toString().padStart(2, "0")}:00`;

  const timeDisplay = document.getElementById("timeDisplay");
  if (timeDisplay) {
    timeDisplay.textContent = rangeText;
    timeDisplay.classList.add("has-value");
  }

  const timeInput = document.getElementById("timeSelect");
  if (timeInput) timeInput.value = time;

  document.getElementById("timeField")?.classList.remove("error");
  updateTimePickerHeader(requestedHours);

  document.querySelectorAll(".time-slot").forEach((slot) => {
    slot.classList.remove("selected");
    if (slot.textContent === time && slot.classList.contains("free")) {
      slot.classList.add("selected");
    }
  });

  const doneBtn = document.getElementById("timePickerDone");
  if (doneBtn) doneBtn.disabled = false;

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

  const hoursSelect = document.getElementById("hoursSelect");
  if (hoursSelect) {
    const requestedHours = parseInt(hoursSelect.value) || 1;
    updateTimePickerHeader(requestedHours);
  }
}

function confirmTimePicker() {
  if (!selectedTime) return;
  closeTimePicker(null, true);
  if (telegramApp) telegramApp.hapticFeedback("success");
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

  let originalPrice;

  if (service.defaultHours) {
    originalPrice = service.price;
  } else if (service.bookingType === "none") {
    originalPrice = service.price;
  } else {
    const hours = parseInt(hoursSelect.value) || 1;
    originalPrice = service.price * hours;
  }

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

// ⭐ Скидка только по userId
function isDiscountActive() {
  const userId = telegramApp?.getUserId();
  if (!userId) return false;
  return localStorage.getItem(`user_confirmed_${userId}`) !== "true";
}

// ===== ОТПРАВКА =====
async function sendToTelegram(bookingData) {
  try {
    const headers = { "Content-Type": "application/json" };
    const initData = telegramApp?.getInitData?.();
    if (initData) headers["X-Telegram-Init-Data"] = initData;

    const response = await fetch(`${WORKER_URL}/api/booking`, {
      method: "POST",
      headers,
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
  } catch (error) {
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
  let isValid = true;

  if (!validateField("serviceSelect", serviceId)) isValid = false;

  if (service && service.bookingType !== "none") {
    const date = document.getElementById("bookingDate").value;
    if (!validateField("bookingDate", date && date.length === 10))
      isValid = false;
  }

  if (service && service.bookingType === "hourly") {
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

  const date = document.getElementById("bookingDate").value || "";
  const time = document.getElementById("timeSelect").value || "";

  let hours = "1";
  if (service.bookingType === "none") hours = "0";
  else if (service.defaultHours) hours = String(service.defaultHours);
  else hours = document.getElementById("hoursSelect").value;

  if (service.bookingType === "hourly" && date && time) {
    const startHour = parseInt(time.split(":")[0]);
    const availability = checkSlotsAvailability(
      date,
      startHour,
      parseInt(hours),
    );

    if (!availability.ok) {
      const c = availability.conflict;
      showError(
        `Конфликт: ${c.date} в ${c.hour} уже занято. Выберите другое время.`,
      );
      loadBookedDatesInBackground();
      return;
    }
  }

  let originalPrice;

  if (service.defaultHours) {
    originalPrice = service.price;
  } else if (service.bookingType === "none") {
    originalPrice = service.price;
  } else {
    const hoursNum = parseInt(hours) || 1;
    originalPrice = service.price * hoursNum;
  }

  const discountActive = isDiscountActive();
  const finalPrice = discountActive
    ? Math.round(originalPrice * (1 - DISCOUNT_PERCENT / 100))
    : originalPrice;

  // ⭐ userId и username для отображения в уведомлении
  const bookingData = {
    userId: telegramApp?.getUserId() || null,
    username: telegramApp?.getUserName() || null,
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

  const uiTimeout = setTimeout(() => {
    btnBook.innerHTML = originalText;
    btnBook.disabled = false;
    showError(
      "Превышено время ожидания. Проверьте подключение к интернету или попробуйте другой VPN/прокси.",
    );
  }, 15000);

  const sent = await sendToTelegram(bookingData);
  clearTimeout(uiTimeout);

  btnBook.innerHTML = originalText;
  btnBook.disabled = false;

  if (sent) {
    showSuccess();
    clearForm();
    if (telegramApp) telegramApp.hapticFeedback("success");
    loadBookedDatesInBackground();
  } else {
    showError(
      "Не удалось отправить заявку. Попробуйте ещё раз или свяжитесь с нами напрямую.",
      true,
    );
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

  document.getElementById("dateField").style.display = "none";
  document.getElementById("timeField").style.display = "none";

  const wrapper = document.getElementById("bookingWrapper");
  if (wrapper) {
    wrapper.classList.remove("has-calendar", "no-calendar");
  }

  document.getElementById("dateField")?.classList.remove("error");
  document.getElementById("timeField")?.classList.remove("error");
}

function onServiceSelect() {
  const serviceId = document.getElementById("serviceSelect").value;
  const bookingWrapper = document.getElementById("bookingWrapper");
  const dateField = document.getElementById("dateField");
  const timeField = document.getElementById("timeField");
  const hoursSelect = document.getElementById("hoursSelect");

  if (!bookingWrapper) return;

  if (!serviceId) {
    bookingWrapper.classList.remove("has-calendar", "no-calendar");
    dateField.style.display = "none";
    timeField.style.display = "none";
    resetSelectedTime();
    updatePrice();
    return;
  }

  const service = services.find((s) => s.id === serviceId);
  if (!service) return;

  document.getElementById("bookingDate").value = "";
  resetSelectedTime();
  selectedDate = null;

  dateField.classList.remove("error");
  timeField.classList.remove("error");

  if (service.bookingType === "none") {
    bookingWrapper.classList.remove("has-calendar");
    bookingWrapper.classList.add("no-calendar");
    dateField.style.display = "none";
    timeField.style.display = "none";
  } else if (service.bookingType === "hourly") {
    bookingWrapper.classList.remove("no-calendar");
    dateField.style.display = "block";
    timeField.style.display = "block";
    bookingWrapper.classList.add("has-calendar");
    hoursSelect.value = service.defaultHours || "1";
  }

  renderCalendar();
  updatePrice();

  if (telegramApp) telegramApp.hapticFeedback("light");
}

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener("DOMContentLoaded", () => {
  renderCalendar();

  const nameField = document.getElementById("nameField");
  const userNameInput = document.getElementById("userName");

  if (telegramApp && telegramApp.isTelegram) {
    const tgName = telegramApp.getUserName();
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

  if (selectedServiceId) {
    document.getElementById("serviceSelect").value = selectedServiceId;
    onServiceSelect();
  }

  ["serviceSelect", "bookingDate", "userName", "userPhone"].forEach(
    clearErrorOnInput,
  );

  const dateInput = document.getElementById("bookingDate");
  const dateField = document.getElementById("dateField");
  if (dateInput && dateField) {
    dateInput.addEventListener("change", () =>
      dateField.classList.remove("error"),
    );
    dateInput.addEventListener("input", () =>
      dateField.classList.remove("error"),
    );
  }

  const phoneInput = document.getElementById("userPhone");

  if (phoneInput) {
    phoneInput.addEventListener("input", (e) => {
      const input = e.target;
      const inputType = e.inputType || "";

      if (inputType.startsWith("delete")) {
        return;
      }

      let digits = input.value.replace(/\D/g, "").slice(0, 15);

      if (digits.length === 0) {
        input.value = "";
        input.closest(".form-group")?.classList.remove("error");
        return;
      }

      let formatted = "+" + digits[0];

      if (digits.length > 1) {
        formatted += " (" + digits.slice(1, 4);
      }
      if (digits.length >= 4) {
        formatted += ")";
      }
      if (digits.length > 4) {
        formatted += " " + digits.slice(4, 7);
      }
      if (digits.length > 7) {
        formatted += "-" + digits.slice(7, 9);
      }
      if (digits.length > 9) {
        formatted += "-" + digits.slice(9, 11);
      }

      input.value = formatted;
      input.setSelectionRange(formatted.length, formatted.length);
      input.closest(".form-group")?.classList.remove("error");
    });
  }

  loadBookedDatesInBackground();
});