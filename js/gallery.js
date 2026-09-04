// Данные для галереи
const galleryData = [
    // { title: 'Основной зал', url: 'images/studio-1.jpg' },
    // { title: 'Микшерный пульт', url: 'images/studio-2.jpg' },
    // { title: 'Вокальная комната', url: 'images/studio-3.jpg' },
    // { title: 'Оборудование', url: 'images/studio-4.jpg' },
    // { title: 'Зона отдыха', url: 'images/studio-5.jpg' },
    // { title: 'Акустика', url: 'images/studio-6.jpg' },
    // { title: 'Барабаны', url: 'images/studio-7.jpg' },
];

let currentGalleryIndex = 0;
let isAnimating = false;

// Обновление галереи с быстрой анимацией
function updateGallery() {
    if (isAnimating) return;
    isAnimating = true;
    
    const galleryImage = document.getElementById('galleryImage');
    const galleryImageTitle = document.getElementById('galleryImageTitle');
    const galleryCounter = document.getElementById('galleryCounter');
    
    // Быстрое затемнение
    galleryImage.classList.add('fade-out');
    
    setTimeout(() => {
        // Меняем фото
        galleryImage.src = galleryData[currentGalleryIndex].url;
        galleryImageTitle.textContent = galleryData[currentGalleryIndex].title;
        galleryCounter.textContent = `${currentGalleryIndex + 1} / ${galleryData.length}`;
        
        // Быстрое появление
        galleryImage.classList.remove('fade-out');
        
        setTimeout(() => {
            isAnimating = false;
        }, 150);
    }, 150);
}

// Переключение фото
function changeGalleryImage(direction) {
    const newIndex = (currentGalleryIndex + direction + galleryData.length) % galleryData.length;
    
    if (newIndex === currentGalleryIndex) return;
    
    currentGalleryIndex = newIndex;
    updateGallery();
    
    if (telegramApp) {
        telegramApp.hapticFeedback('light');
    }
}

// Открытие фото в модальном окне
function openPhotoModal() {
    if (isAnimating) return;
    
    const modal = document.getElementById('photoModal');
    const modalImage = document.getElementById('modalImage');
    const modalCounter = document.getElementById('modalCounter');
    
    modal.classList.add('active');
    modalImage.src = galleryData[currentGalleryIndex].url;
    modalCounter.textContent = `${currentGalleryIndex + 1} / ${galleryData.length}`;
    
    if (telegramApp) {
        telegramApp.hapticFeedback('light');
    }
}

function closePhotoModal() {
    document.getElementById('photoModal').classList.remove('active');
}

function changeModalImage(direction) {
    currentGalleryIndex = (currentGalleryIndex + direction + galleryData.length) % galleryData.length;
    
    const modalImage = document.getElementById('modalImage');
    const modalCounter = document.getElementById('modalCounter');
    
    // Мгновенная смена с лёгким эффектом
    modalImage.style.opacity = '0';
    
    setTimeout(() => {
        modalImage.src = galleryData[currentGalleryIndex].url;
        modalCounter.textContent = `${currentGalleryIndex + 1} / ${galleryData.length}`;
        modalImage.style.opacity = '1';
    }, 100);
    
    if (telegramApp) {
        telegramApp.hapticFeedback('light');
    }
}

// Открытие всех фото
function openAllPhotos() {
    const modal = document.getElementById('allPhotosModal');
    const grid = document.getElementById('allPhotosGrid');
    
    grid.innerHTML = '';
    
    galleryData.forEach((image, index) => {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        item.onclick = () => {
            closeAllPhotos();
            currentGalleryIndex = index;
            openPhotoModal();
        };
        
        item.innerHTML = `<img src="${image.url}" alt="${image.title}" loading="lazy">`;
        grid.appendChild(item);
    });
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    if (telegramApp) {
        telegramApp.hapticFeedback('light');
    }
}

function closeAllPhotos() {
    document.getElementById('allPhotosModal').classList.remove('active');
    document.body.style.overflow = '';
}

// Свайпы для мобильных
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('DOMContentLoaded', () => {
    const slider = document.querySelector('.gallery-slider');
    
    slider.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    slider.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });
    
    // Инициализация
    updateGallery();
});

function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;
    
    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
            changeGalleryImage(1);
        } else {
            changeGalleryImage(-1);
        }
    }
}

// Клавиатура
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closePhotoModal();
        closeAllPhotos();
    }
    
    if (e.key === 'ArrowLeft' && document.getElementById('photoModal').classList.contains('active')) {
        changeModalImage(-1);
    }
    
    if (e.key === 'ArrowRight' && document.getElementById('photoModal').classList.contains('active')) {
        changeModalImage(1);
    }
});