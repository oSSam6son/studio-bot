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
let selectedTime = "";
let bookedSlots = {}; // { "23.09.2026": ["12:00", "13:00"] }

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
  if (!field) return;
  const clear = () => field.closest(".form-group")?.classList.remove("error");
  field.addEventListener("input", clear);
  field.addEventListener("change", clear);
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

  // Проверяем, полностью ли занят день
  const occupiedHours = bookedSlots[dateStr] || [];
  if (occupiedHours.length >= 13) {
    field.closest(".form-group").classList.add("error");
    field.value = "";
    showError("Эта дата полностью занята");
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
    const isFullyBooked = occupiedHours.length >= 13;
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
  if (modal && modal.classList.contains("active"))
    modal.classList.remove("active");

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
  if (!modal) return;
  modal.classList.toggle("active");
  if (modal.classList.contains("active")) renderCalendar();
}

// Закрытие по клику вне календаря
document.addEventListener("click", (e) => {
  const modal = document.getElementById("calendarModal");
  if (!modal || !modal.classList.contains("active")) return;

  const modalContent = modal.querySelector(".calendar-modal-content");
  if (!modalContent) return;

  const isClickOutside = !modalContent.contains(e.target);
  const isToggleBtn = e.target.closest(".calendar-toggle");

  if (isClickOutside && !isToggleBtn) {
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
  if (!container) return;

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

  // Сбрасываем выбранное время (могло стать недоступным)
  if (selectedTime) {
    resetSelectedTime();
  }

  // Обновляем цену
  updatePrice();

  // Перерисовываем сетку часов (занятые слоты пересчитаются)
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

  for (let hour = 10; hour <= 22; hour++) {
    const time = `${hour.toString().padStart(2, "0")}:00`;

    // Проверяем, можно ли забронировать
    let canBook = true;

    // Хватает ли времени до конца дня
    if (hour + requestedHours > 23) {
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
  const hours = parseInt(hoursSelect.value) || 1;
  const totalPriceElement = document.getElementById("totalPrice");
  const priceSummary = document.getElementById("priceSummary");
  const priceDiscount = document.getElementById("priceDiscount");
  const service = services.find((s) => s.id === selectedId);

  if (service) {
    const originalPrice = service.price * hours;
    const discountActive = isDiscountActive();

    if (discountActive) {
      const discountedPrice = Math.round(
        originalPrice * (1 - DISCOUNT_PERCENT / 100),
      );
      totalPriceElement.textContent = `${discountedPrice.toLocaleString()} ₽`;

      // ⭐ Показать бейдж скидки
      if (priceDiscount) {
        priceDiscount.style.display = "inline-flex";
      }
    } else {
      totalPriceElement.textContent = `${originalPrice.toLocaleString()} ₽`;

      if (priceDiscount) {
        priceDiscount.style.display = "none";
      }
    }

    priceSummary.style.display = "flex";
  } else {
    totalPriceElement.textContent = "0 ₽";
    priceSummary.style.display = "none";
    if (priceDiscount) {
      priceDiscount.style.display = "none";
    }
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

async function loadBookedDatesInBackground() {
  // ⭐ Загружаем с сервера
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${WORKER_URL}/api/booked-dates`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const data = await response.json();
    bookedSlots = data.bookings || {};

    // Сохраняем кэш — только после успешной загрузки
    localStorage.setItem("bookedSlots", JSON.stringify(bookedSlots));
    renderCalendar();

    console.log("bookedSlots загружен:", bookedSlots); // для отладки
  } catch (error) {
    console.warn("Ошибка загрузки дат:", error.message);

    // Fallback: если сеть упала — берём из кэша
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
  const date = document.getElementById("bookingDate").value;
  const time = document.getElementById("timeSelect").value;
  const hours = document.getElementById("hoursSelect").value;
  const name =
    document.getElementById("userName").value ||
    (telegramApp?.isTelegram ? telegramApp.getUserName() : "") ||
    "";
  const phone = document.getElementById("userPhone").value;
  const serviceId = document.getElementById("serviceSelect").value;

  let isValid = true;
  if (!validateField("serviceSelect", serviceId)) isValid = false;
  if (!validateField("bookingDate", date && date.length === 10))
    isValid = false;
  if (!validateField("timeField", time && time.length > 0)) isValid = false;

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

  const service = services.find((s) => s.id === serviceId);
  const hoursNum = parseInt(hours);
  const originalPrice = service.price * hoursNum;
  const discountActive = localStorage.getItem("discountActive") === "true";
  const finalPrice = discountActive
    ? Math.round(originalPrice * (1 - DISCOUNT_PERCENT / 100))
    : originalPrice;

  const bookingData = {
    userId: telegramApp?.getUserId() || null,
    name: name || (telegramApp ? telegramApp.getUserName() : "Клиент"),
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
  document.getElementById("hoursSelect").value = "1";
  document.getElementById("userPhone").value = "";

  resetSelectedTime();

  const nameField = document.getElementById("nameField");
  if (nameField && !nameField.classList.contains("hidden-in-tg")) {
    document.getElementById("userName").value = "";
  }

  selectedDate = null;
  updatePrice();
}

function onServiceSelect() {
  const serviceId = document.getElementById("serviceSelect").value;
  const bookingWrapper = document.getElementById("bookingWrapper");

  if (!bookingWrapper) return;

  if (serviceId) {
    bookingWrapper.classList.add("has-calendar");
    renderCalendar();
    updatePrice();
    if (telegramApp) telegramApp.hapticFeedback("light");
  } else {
    bookingWrapper.classList.remove("has-calendar");
  }
}

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

  if (selectedServiceId) {
    document.getElementById("serviceSelect").value = selectedServiceId;
    updatePrice();
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

      // Оставляем только цифры
      let digits = input.value.replace(/\D/g, "");

      // Убираем ведущую 7 или 8
      if (digits.startsWith("7") || digits.startsWith("8")) {
        digits = digits.slice(1);
      }

      digits = digits.slice(0, 10);

      // Если цифр нет — поле пустое
      if (digits.length === 0) {
        input.value = "";
        input.closest(".form-group")?.classList.remove("error");
        return;
      }

      // Форматируем
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

    // ⭐ При Backspace — стираем цифру принудительно
    phoneInput.addEventListener("keydown", (e) => {
      if (e.key === "Backspace") {
        const input = e.target;
        const cursorPos = input.selectionStart;

        // Если курсор стоит сразу после скобки или дефиса — сдвигаем на 1 назад
        const charBefore = input.value[cursorPos - 1];
        if (charBefore && /[\s\-\(\)]/.test(charBefore)) {
          e.preventDefault();
          // Удаляем символ перед курсором
          input.value =
            input.value.slice(0, cursorPos - 2) +
            input.value.slice(cursorPos - 1);
          // Триггерим input для переформатирования
          input.dispatchEvent(new Event("input", { bubbles: true }));
        }
      }
    });
  }

  // ⭐ Фоновая загрузка дат — ПОСЛЕДНЕЙ, чтобы всё успело инициализироваться
  loadBookedDatesInBackground();
});
