// ===== ПРОВЕРКА ДОСТУПНОСТИ ВОРКЕРА =====
// Если воркер недоступен (нет VPN / блокировка) — показываем предупреждение

(function () {
  const WORKER_URL = "https://flstudio-bot.flstudio.workers.dev";
  const CHECK_TIMEOUT = 5000;

  function showVpnBanner() {
    // Не показываем дважды
    if (document.getElementById("vpnBanner")) return;

    const banner = document.createElement("div");
    banner.id = "vpnBanner";
    banner.className = "vpn-banner";
    banner.innerHTML = `
      <div class="vpn-banner-content">
        <i class="fas fa-exclamation-triangle"></i>
        <span>Некоторые функции сервиса могут быть недоступны. Пожалуйста, подключите VPN.</span>
        <button class="vpn-banner-close" onclick="this.parentElement.parentElement.remove()">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;

    // Вставляем после body
    document.body.insertBefore(banner, document.body.firstChild);

    // Автоматически анимируем появление
    setTimeout(() => banner.classList.add("visible"), 50);
  }

  async function checkWorker() {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), CHECK_TIMEOUT);

      const response = await fetch(`${WORKER_URL}/api/booked-dates`, {
        method: "GET",
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        showVpnBanner();
      }
    } catch (e) {
      // Сеть не работает / таймаут / заблокировано
      showVpnBanner();
    }
  }

  // Проверяем на всех страницах после загрузки
  document.addEventListener("DOMContentLoaded", () => {
    // Небольшая задержка, чтобы не мешать остальным скриптам
    setTimeout(checkWorker, 500);
  });
})();
