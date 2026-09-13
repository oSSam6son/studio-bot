// Инициализация Telegram Web App
class TelegramIntegration {
  constructor() {
    this.tg = window.Telegram?.WebApp;
    this.isTelegram = !!this.tg;

    if (this.isTelegram) {
      this.initTelegram();
    }
  }

  initTelegram() {
    this.tg.ready();
    this.tg.expand();
    this.setupTheme();
    this.getUserData();
    document.body.classList.add("telegram-app");
  }

  setupTheme() {
    this.tg.setHeaderColor("#0a0a0a");
    this.tg.setBackgroundColor("#0a0a0a");
    this.tg.setBottomBarColor("#0a0a0a");
  }

  getUserData() {
    const user = this.tg.initDataUnsafe?.user;
    if (user) {
      const nameInput = document.getElementById("userName");
      if (nameInput && user.first_name) {
        nameInput.value =
          user.first_name + (user.last_name ? " " + user.last_name : "");
      }
    }
  }

  // Возвращает имя пользователя для отправки
  getUserName() {
    if (!this.isTelegram) return null;
    const user = this.tg.initDataUnsafe?.user;
    if (!user) return null;

    // Приоритет: @username → имя
    if (user.username) {
      return `@${user.username}`;
    }
    return `${user.first_name || ""} ${user.last_name || ""}`.trim();
  }

  sendData(data) {
    if (this.isTelegram) {
      this.tg.sendData(JSON.stringify(data));
    }
  }

  showAlert(message) {
    if (this.isTelegram) {
      this.tg.showAlert(message);
    } else {
      alert(message);
    }
  }

  hapticFeedback(type = "success") {
    if (this.isTelegram && this.tg.HapticFeedback) {
      this.tg.HapticFeedback.notificationOccurred(type);
    }
  }
}

const telegramApp = new TelegramIntegration();

// ===== НАВИГАЦИЯ =====
function scrollToBooking() {
  const el = document.getElementById("booking");
  if (el) el.scrollIntoView({ behavior: "smooth" });
}

function scrollToGallery() {
  const el = document.getElementById("gallery");
  if (el) el.scrollIntoView({ behavior: "smooth" });
}

function scrollToTop(event) {
  event.preventDefault();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function toggleMenu() {
  const nav = document.getElementById("nav");
  if (nav) nav.classList.toggle("active");
}

// ===== ПРОМО =====
function showPromo() {
  const promo = document.getElementById("promoOverlay");
  if (!promo) return;
  promo.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closePromo() {
  const promo = document.getElementById("promoOverlay");
  if (!promo) return;
  promo.classList.add("closing");
  document.body.style.overflow = "";

  setTimeout(() => {
    promo.classList.remove("active");
    promo.classList.remove("closing");
  }, 300);
}

document.addEventListener("click", (e) => {
  const promo = document.getElementById("promoOverlay");
  if (!promo) return;

  const promoModal = promo.querySelector(".promo-modal");
  if (!promoModal) return;

  if (promo.classList.contains("active") && !promoModal.contains(e.target)) {
    closePromo();
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const promo = document.getElementById("promoOverlay");
  if (!promo) return;

  const promoShown = localStorage.getItem("promoShown");
  if (!promoShown) {
    setTimeout(showPromo, 1000);
  }
});
