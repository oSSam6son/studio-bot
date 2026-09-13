// ===== ДАННЫЕ ГАЛЕРЕИ =====
const galleryData = [
  { title: "Основной зал", url: "images/studio-1.jpg" },
  { title: "Микшерный пульт", url: "images/studio-2.jpg" },
  { title: "Вокальная комната", url: "images/studio-3.jpg" },
  { title: "Оборудование", url: "images/studio-4.jpg" },
  { title: "Зона отдыха", url: "images/studio-5.jpg" },
  { title: "Акустика", url: "images/studio-6.jpg" },
  { title: "Барабаны", url: "images/studio-7.jpg" },
];

// ===== СОСТОЯНИЕ =====
let currentGalleryIndex = 0;
let isGalleryAnimating = false; // ⭐ Защита от спама
const ANIMATION_DURATION = 600; // мс — совпадает с CSS transition

// ===== ИНИЦИАЛИЗАЦИЯ =====
function initGallery() {
  const track = document.getElementById("galleryTrack");
  const dotsContainer = document.getElementById("galleryDots");

  if (!track) return;

  // Очищаем и заполняем слайды
  track.innerHTML = "";
  galleryData.forEach((image, index) => {
    const slide = document.createElement("div");
    slide.className = "gallery-slide";
    slide.dataset.index = index;
    slide.onclick = () => handleSlideClick(index);
    slide.innerHTML = `
      <img src="${image.url}" alt="${image.title}" loading="lazy">
      <div class="gallery-slide-title">${image.title}</div>
    `;
    track.appendChild(slide);
  });

  // Точки
  if (dotsContainer) {
    dotsContainer.innerHTML = "";
    galleryData.forEach((_, index) => {
      const dot = document.createElement("button");
      dot.className = "gallery-dot";
      dot.onclick = () => goToSlide(index);
      dotsContainer.appendChild(dot);
    });
  }

  // Первичная расстановка
  updateGallery();
}

// ===== ОБНОВЛЕНИЕ ПОЗИЦИЙ =====
function updateGallery() {
  const slides = document.querySelectorAll(".gallery-slide");
  const dots = document.querySelectorAll(".gallery-dot");
  const total = galleryData.length;

  const prevIndex = (currentGalleryIndex - 1 + total) % total;
  const nextIndex = (currentGalleryIndex + 1) % total;
  const prevPrevIndex = (currentGalleryIndex - 2 + total) % total;
  const nextNextIndex = (currentGalleryIndex + 2) % total;

  slides.forEach((slide, index) => {
    slide.classList.remove(
      "pos-left",
      "pos-center",
      "pos-right",
      "pos-hidden-left",
      "pos-hidden-right",
    );

    if (index === currentGalleryIndex) {
      slide.classList.add("pos-center");
    } else if (index === prevIndex) {
      slide.classList.add("pos-left");
    } else if (index === nextIndex) {
      slide.classList.add("pos-right");
    } else if (index === prevPrevIndex) {
      slide.classList.add("pos-hidden-left");
    } else if (index === nextNextIndex) {
      slide.classList.add("pos-hidden-right");
    } else {
      slide.classList.add("pos-hidden-right");
    }
  });

  dots.forEach((dot, index) => {
    dot.classList.toggle("active", index === currentGalleryIndex);
  });
}

// ===== ПЕРЕКЛЮЧЕНИЕ ФОТО =====
function changeGalleryImage(direction) {
  // ⭐ Защита от спама
  if (isGalleryAnimating) return;

  isGalleryAnimating = true;

  const total = galleryData.length;
  currentGalleryIndex = (currentGalleryIndex + direction + total) % total;

  updateGallery();

  if (telegramApp) telegramApp.hapticFeedback("light");

  // Разблокировка через ANIMATION_DURATION
  setTimeout(() => {
    isGalleryAnimating = false;
  }, ANIMATION_DURATION);
}

// ===== ПЕРЕХОД НА КОНКРЕТНЫЙ СЛАЙД =====
function goToSlide(index) {
  if (isGalleryAnimating) return;
  if (index === currentGalleryIndex) return;

  isGalleryAnimating = true;
  currentGalleryIndex = index;
  updateGallery();

  if (telegramApp) telegramApp.hapticFeedback("light");

  setTimeout(() => {
    isGalleryAnimating = false;
  }, ANIMATION_DURATION);
}

// ===== КЛИК ПО СЛАЙДУ =====
function handleSlideClick(index) {
  if (isGalleryAnimating) return;

  if (index === currentGalleryIndex) {
    // Клик по центральному — открываем модалку
    openPhotoModal();
  } else {
    // Клик по боковому — переходим на него
    goToSlide(index);
  }
}

// ===== МОДАЛКА ФОТО =====
function openPhotoModal() {
  const modal = document.getElementById("photoModal");
  const modalImage = document.getElementById("modalImage");
  const modalCounter = document.getElementById("modalCounter");

  if (!modal || !modalImage) return;

  modal.classList.add("active");
  modalImage.src = galleryData[currentGalleryIndex].url;

  if (modalCounter) {
    modalCounter.textContent = `${currentGalleryIndex + 1} / ${galleryData.length}`;
  }

  if (telegramApp) telegramApp.hapticFeedback("light");
}

function closePhotoModal() {
  const modal = document.getElementById("photoModal");
  if (!modal) return;
  modal.classList.remove("active");
}

function changeModalImage(direction) {
  const total = galleryData.length;
  currentGalleryIndex = (currentGalleryIndex + direction + total) % total;

  const modalImage = document.getElementById("modalImage");
  const modalCounter = document.getElementById("modalCounter");

  if (!modalImage) return;

  // Мгновенная смена с лёгким fade
  modalImage.style.opacity = "0";

  setTimeout(() => {
    modalImage.src = galleryData[currentGalleryIndex].url;
    if (modalCounter) {
      modalCounter.textContent = `${currentGalleryIndex + 1} / ${galleryData.length}`;
    }
    modalImage.style.opacity = "1";
    updateGallery();
  }, 150);

  if (telegramApp) telegramApp.hapticFeedback("light");
}

// ===== МОДАЛКА ВСЕХ ФОТО =====
function openAllPhotos() {
  const modal = document.getElementById("allPhotosModal");
  const grid = document.getElementById("allPhotosGrid");

  if (!modal || !grid) return;

  grid.innerHTML = "";
  galleryData.forEach((image, index) => {
    const item = document.createElement("div");
    item.className = "gallery-item";
    item.onclick = () => {
      closeAllPhotos();
      currentGalleryIndex = index;
      updateGallery();
      openPhotoModal();
    };
    item.innerHTML = `<img src="${image.url}" alt="${image.title}" loading="lazy">`;
    grid.appendChild(item);
  });

  modal.classList.add("active");
  document.body.style.overflow = "hidden";

  if (telegramApp) telegramApp.hapticFeedback("light");
}

function closeAllPhotos() {
  const modal = document.getElementById("allPhotosModal");
  if (!modal) return;
  modal.classList.remove("active");
  document.body.style.overflow = "";
}

// ===== СВАЙПЫ =====
let touchStartX = 0;
let touchStartY = 0;

function initSwipe() {
  const slider = document.querySelector(".gallery-slider");
  if (!slider) return;

  slider.addEventListener(
    "touchstart",
    (e) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    },
    { passive: true },
  );

  slider.addEventListener(
    "touchend",
    (e) => {
      // ⭐ Защита от спама
      if (isGalleryAnimating) return;

      const diffX = touchStartX - e.changedTouches[0].screenX;
      const diffY = touchStartY - e.changedTouches[0].screenY;

      // Только горизонтальные свайпы длиной больше 50px
      if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX > 0) {
          changeGalleryImage(1);
        } else {
          changeGalleryImage(-1);
        }
      }
    },
    { passive: true },
  );
}

// ===== КЛАВИАТУРА =====
document.addEventListener("keydown", (e) => {
  const photoModal = document.getElementById("photoModal");
  const isPhotoModalOpen =
    photoModal && photoModal.classList.contains("active");

  // Закрытие модалок
  if (e.key === "Escape") {
    closePhotoModal();
    closeAllPhotos();
    return;
  }

  // Управление в модалке фото
  if (isPhotoModalOpen) {
    if (e.key === "ArrowLeft") changeModalImage(-1);
    if (e.key === "ArrowRight") changeModalImage(1);
    return;
  }

  // Управление каруселью
  if (e.key === "ArrowLeft") changeGalleryImage(-1);
  if (e.key === "ArrowRight") changeGalleryImage(1);
});

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener("DOMContentLoaded", () => {
  initGallery();
  initSwipe();
});
