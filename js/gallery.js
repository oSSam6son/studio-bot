const galleryData = [
  { title: "Основной зал", url: "images/studio-1.jpg" },
  { title: "Микшерный пульт", url: "images/studio-2.jpg" },
  { title: "Вокальная комната", url: "images/studio-3.jpg" },
  { title: "Оборудование", url: "images/studio-4.jpg" },
  { title: "Зона отдыха", url: "images/studio-5.jpg" },
  { title: "Акустика", url: "images/studio-6.jpg" },
  { title: "Барабаны", url: "images/studio-7.jpg" },
];

let currentGalleryIndex = 0;
let isAnimating = false;

function updateGallery() {
  if (isAnimating) return;
  isAnimating = true;

  const galleryImage = document.getElementById("galleryImage");
  const galleryImageTitle = document.getElementById("galleryImageTitle");
  const galleryCounter = document.getElementById("galleryCounter");

  galleryImage.classList.add("fade-out");

  setTimeout(() => {
    galleryImage.src = galleryData[currentGalleryIndex].url;
    galleryImageTitle.textContent = galleryData[currentGalleryIndex].title;
    galleryCounter.textContent = `${currentGalleryIndex + 1} / ${galleryData.length}`;
    galleryImage.classList.remove("fade-out");

    setTimeout(() => {
      isAnimating = false;
    }, 150);
  }, 150);
}

function changeGalleryImage(direction) {
  const newIndex =
    (currentGalleryIndex + direction + galleryData.length) % galleryData.length;
  if (newIndex === currentGalleryIndex) return;
  currentGalleryIndex = newIndex;
  updateGallery();
  if (telegramApp) telegramApp.hapticFeedback("light");
}

function openPhotoModal() {
  if (isAnimating) return;
  const modal = document.getElementById("photoModal");
  const modalImage = document.getElementById("modalImage");
  const modalCounter = document.getElementById("modalCounter");
  modal.classList.add("active");
  modalImage.src = galleryData[currentGalleryIndex].url;
  modalCounter.textContent = `${currentGalleryIndex + 1} / ${galleryData.length}`;
}

function closePhotoModal() {
  document.getElementById("photoModal").classList.remove("active");
}

function changeModalImage(direction) {
  currentGalleryIndex =
    (currentGalleryIndex + direction + galleryData.length) % galleryData.length;
  const modalImage = document.getElementById("modalImage");
  const modalCounter = document.getElementById("modalCounter");
  modalImage.style.opacity = "0";
  setTimeout(() => {
    modalImage.src = galleryData[currentGalleryIndex].url;
    modalCounter.textContent = `${currentGalleryIndex + 1} / ${galleryData.length}`;
    modalImage.style.opacity = "1";
  }, 100);
}

function openAllPhotos() {
  const modal = document.getElementById("allPhotosModal");
  const grid = document.getElementById("allPhotosGrid");
  grid.innerHTML = "";

  galleryData.forEach((image, index) => {
    const item = document.createElement("div");
    item.className = "gallery-item";
    item.onclick = () => {
      closeAllPhotos();
      currentGalleryIndex = index;
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

document.addEventListener("DOMContentLoaded", updateGallery);
