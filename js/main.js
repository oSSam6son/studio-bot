// Основные функции сайта
const galleryImages = [
    'images/studio1.jpg',
    'images/studio2.jpg',
    'images/studio3.jpg',
    'images/studio4.jpg'
];

let currentImageIndex = 0;

// Навигация
document.addEventListener('DOMContentLoaded', () => {
    // Burger menu
    const burgerMenu = document.getElementById('burgerMenu');
    const nav = document.querySelector('.nav');
    
    if (burgerMenu) {
        burgerMenu.addEventListener('click', () => {
            nav.classList.toggle('active');
        });
    }
    
    // Закрытие меню при клике на ссылку
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            nav.classList.remove('active');
        });
    });
    
    // Установка минимальной даты для бронирования
    const dateInput = document.getElementById('bookingDate');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
        
        // Заполнение времени
        const timeSelect = document.getElementById('bookingTime');
        for (let hour = 10; hour <= 21; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                const option = document.createElement('option');
                option.value = time;
                option.textContent = time;
                timeSelect.appendChild(option);
            }
        }
    }
    
    // Анимация при скролле
    window.addEventListener('scroll', () => {
        const sections = document.querySelectorAll('.section');
        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            if (rect.top < window.innerHeight * 0.8 && rect.bottom > 0) {
                section.style.opacity = '1';
                section.style.transform = 'translateY(0)';
            }
        });
    });
    
    // Инициализация анимаций
    document.querySelectorAll('.section').forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        section.style.transition = 'all 0.6s ease';
    });
});

// Галерея
function openLightbox(index) {
    currentImageIndex = index;
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightboxImage');
    
    lightbox.classList.add('active');
    lightboxImage.src = galleryImages[index];
    
    if (telegramApp) {
        telegramApp.hapticFeedback('light');
    }
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    lightbox.classList.remove('active');
}

function changeImage(direction) {
    currentImageIndex = (currentImageIndex + direction + galleryImages.length) % galleryImages.length;
    const lightboxImage = document.getElementById('lightboxImage');
    lightboxImage.src = galleryImages[currentImageIndex];
}

// Выбор услуги
function selectService(name, price) {
    const serviceInput = document.getElementById('selectedService');
    serviceInput.value = `${name} - ${price} ₽`;
    
    // Сохраняем выбранную услугу
    window.selectedServiceData = { name, price };
    
    // Скроллим к бронированию
    scrollToBooking();
    
    if (telegramApp) {
        telegramApp.hapticFeedback('success');
    }
}

function scrollToBooking() {
    const bookingSection = document.getElementById('booking');
    bookingSection.scrollIntoView({ behavior: 'smooth' });
}

// Закрытие lightbox по ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeLightbox();
    }
});