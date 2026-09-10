const galleryData = [
  { title: "Основной зал", url: "images/studio-1.jpg" },
  { title: "Микшерный пульт", url: "images/studio-2.jpg" },
  { title: "Вокальная комната", url: "images/studio-3.jpg" },
  { title: "Оборудование", url: "images/studio-4.jpg" },
  { title: "Зона отдыха", url: "images/studio-5.jpg" },
  { title: "Акустика", url: "images/studio-6.jpg" },
  { title: "Барабаны", url: "images/studio-7.jpg" },
];

let currentSlide = 0;
let isAnimating = false;
const N = galleryData.length;

// Все слайды в DOM
let slides = [];

function initGallery() {
  const track = document.getElementById("galleryTrack");
  const dotsContainer = document.getElementById("galleryDots");

  track.innerHTML = "";
  slides = [];

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
    slides.push(slide);
  });

  dotsContainer.innerHTML = "";
  galleryData.forEach((_, index) => {
    const dot = document.createElement("button");
    dot.className = "gallery-dot";
    dot.onclick = () => goToSlide(index);
    dotsContainer.appendChild(dot);
  });

  updatePositions();
}

// Расстановка позиций: кому какой класс
function updatePositions() {
  // Определяем индексы
  const prevIndex = (currentSlide - 1 + N) % N;
  const nextIndex = (currentSlide + 1) % N;
  const prevPrevIndex = (currentSlide - 2 + N) % N;
  const nextNextIndex = (currentSlide + 2) % N;

  slides.forEach((slide, index) => {
    // Сбрасываем классы
    slide.classList.remove(
      "pos-left",
      "pos-center",
      "pos-right",
      "pos-hidden-left",
      "pos-hidden-right",
    );

    if (index === currentSlide) {
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
      // Все остальные — далеко скрыты
      slide.classList.add("pos-hidden-right");
    }
  });

  // Обновляем точки
  document.querySelectorAll(".gallery-dot").forEach((dot, index) => {
    dot.classList.toggle("active", index === currentSlide);
  });
}

function handleSlideClick(index) {
  if (index === currentSlide) {
    openPhotoModal();
  } else {
    goToSlide(index);
  }
}

function goToSlide(index) {
  if (isAnimating) return;

  // Зацикливание
  index = ((index % N) + N) % N;

  if (index === currentSlide) return;

  isAnimating = true;
  currentSlide = index;
  updatePositions();

  setTimeout(() => {
    isAnimating = false;
  }, 600);

  if (telegramApp) telegramApp.hapticFeedback("light");
}

function slideGallery(direction) {
  goToSlide(currentSlide + direction);
}

// Свайпы
let touchStartX = 0;

document.addEventListener("DOMContentLoaded", () => {
  initGallery();

  const slider = document.querySelector(".gallery-slider");

  slider.addEventListener(
    "touchstart",
    (e) => {
      touchStartX = e.changedTouches[0].screenX;
    },
    { passive: true },
  );

  slider.addEventListener(
    "touchend",
    (e) => {
      const diff = touchStartX - e.changedTouches[0].screenX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) slideGallery(1);
        else slideGallery(-1);
      }
    },
    { passive: true },
  );
});

// Клавиатура
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") slideGallery(-1);
  if (e.key === "ArrowRight") slideGallery(1);
});

// Модалка
function openPhotoModal() {
  const modal = document.getElementById("photoModal");
  const modalImage = document.getElementById("modalImage");
  const modalCounter = document.getElementById("modalCounter");

  if (!modal) return;

  modal.classList.add("active");
  modalImage.src = galleryData[currentSlide].url;
  modalCounter.textContent = `${currentSlide + 1} / ${N}`;
}

function closePhotoModal() {
  document.getElementById("photoModal").classList.remove("active");
}

function changeModalImage(direction) {
  currentSlide = (currentSlide + direction + N) % N;

  const modalImage = document.getElementById("modalImage");
  const modalCounter = document.getElementById("modalCounter");

  modalImage.style.opacity = "0";
  setTimeout(() => {
    modalImage.src = galleryData[currentSlide].url;
    modalCounter.textContent = `${currentSlide + 1} / ${N}`;
    modalImage.style.opacity = "1";
    updatePositions();
  }, 150);
}

function openAllPhotos() {
  const modal = document.getElementById("allPhotosModal");
  const grid = document.getElementById("allPhotosGrid");
  if (!modal) return;

  grid.innerHTML = "";
  galleryData.forEach((image, index) => {
    const item = document.createElement("div");
    item.className = "gallery-item";
    item.onclick = () => {
      closeAllPhotos();
      goToSlide(index);
      openPhotoModal();
    };
    item.innerHTML = `<img src="${image.url}" alt="${image.title}" loading="lazy">`;
    grid.appendChild(item);
  });

  modal.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeAllPhotos() {
  document.getElementById("allPhotosModal").classList.remove("active");
  document.body.style.overflow = "";
}
