// ===== ИНИЦИАЛИЗАЦИЯ TELEGRAM WEB APP =====
class TelegramIntegration {
  constructor() {
    this.tg = window.Telegram?.WebApp;

    // ⭐ Проверяем что мы РЕАЛЬНО в Telegram
    this.isTelegram = !!(
      this.tg &&
      this.tg.initData &&
      this.tg.initData.length > 0
    );

    if (this.isTelegram) {
      this.initTelegram();
    }
  }

  // ⭐ ЕДИНСТВЕННЫЙ setupTheme (был дубликат — убран)
  setupTheme() {
    try {
      if (this.tg.setHeaderColor) this.tg.setHeaderColor("#0a0a0a");
      if (this.tg.setBackgroundColor) this.tg.setBackgroundColor("#0a0a0a");
      if (this.tg.setBottomBarColor && this.tg.isVersionAtLeast?.("7.10")) {
        this.tg.setBottomBarColor("#0a0a0a");
      }
    } catch (e) {}
  }

  initTelegram() {
    this.tg.ready();
    this.tg.expand();
    this.setupTheme();
    this.getUserData();
    document.body.classList.add("telegram-app");
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

  // ⭐ Возвращает подписанный initData для отправки на воркер
  getInitData() {
    if (!this.isTelegram) return "";
    return this.tg.initData || "";
  }

  // Возвращает @username или имя
  getUserName() {
    if (!this.isTelegram) return null;
    const user = this.tg.initDataUnsafe?.user;
    if (!user) return null;

    if (user.username) return `@${user.username}`;

    const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();
    if (fullName) return fullName;

    return "Клиент";
  }

  // Возвращает ID юзера (для UI-логики, НЕ для доверия на сервере)
  getUserId() {
    if (!this.isTelegram) return null;
    const user = this.tg.initDataUnsafe?.user;
    return user?.id || null;
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
    if (!this.isTelegram) return;
    if (!this.tg.HapticFeedback) return;

    if (this.tg.isVersionAtLeast && !this.tg.isVersionAtLeast("6.1")) {
      return;
    }

    const impactStyles = ["light", "medium", "heavy", "rigid", "soft"];
    const notificationTypes = ["success", "error", "warning"];

    try {
      if (impactStyles.includes(type)) {
        this.tg.HapticFeedback.impactOccurred(type);
      } else if (notificationTypes.includes(type)) {
        this.tg.HapticFeedback.notificationOccurred(type);
      } else {
        this.tg.HapticFeedback.impactOccurred("light");
      }
    } catch (e) {}
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

// ===== ПРОМО-УВЕДОМЛЕНИЕ =====
function showPromo() {
  const promo = document.getElementById("promoOverlay");
  if (!promo) return;
  promo.classList.add("active");
  document.body.style.overflow = "hidden";
  localStorage.setItem("promoShown", "true");
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

// ⭐ Логика показа промо: показываем только тем, кто НЕ ПОДТВЕРЖДЁН админом
document.addEventListener("DOMContentLoaded", async () => {
  const promo = document.getElementById("promoOverlay");
  const userId = telegramApp?.getUserId();
  const WORKER = "https://flstudio-bot.flstudio.workers.dev";

  if (!userId) {
    if (promo && !localStorage.getItem("promoShown")) {
      setTimeout(showPromo, 1000);
    }
    return;
  }

  try {
    const headers = { "Content-Type": "application/json" };
    const initData = telegramApp?.getInitData?.();
    if (initData) headers["X-Telegram-Init-Data"] = initData;

    const response = await fetch(`${WORKER}/api/check-promo`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        userId,
        username: telegramApp?.getUserName?.() || null, // ⭐ НОВОЕ
      }),
    });
    const data = await response.json();

    if (data.show) {
      localStorage.setItem(`user_confirmed_${userId}`, "false");
      if (promo) {
        setTimeout(showPromo, 1000);
      }
    } else {
      localStorage.setItem(`user_confirmed_${userId}`, "true");
    }
  } catch (error) {
    console.warn("Проверка промо не удалась:", error);
    if (promo && !localStorage.getItem("promoShown")) {
      setTimeout(showPromo, 1000);
    }
  }
});
