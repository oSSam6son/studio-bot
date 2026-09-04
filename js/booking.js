// Данные услуг
const services = [
    { id: 'recording', name: 'Запись вокала', description: 'Профессиональная запись с звукорежиссёром', price: 2500, icon: 'fa-microphone' },
    { id: 'mixing', name: 'Сведение', description: 'Многоканальное сведение трека', price: 5000, icon: 'fa-sliders-h' },
    { id: 'mastering', name: 'Мастеринг', description: 'Финальная обработка трека', price: 3000, icon: 'fa-wave-square' },
    { id: 'full', name: 'Под ключ', description: 'Запись + сведение + мастеринг', price: 15000, icon: 'fa-music' },
    { id: 'rehearsal', name: 'Репетиция', description: 'Аренда студии для репетиции', price: 1500, icon: 'fa-guitar' }
];

let currentDate = new Date();
let selectedDate = null;

// Загрузка услуг
function loadServices() {
    const servicesGrid = document.getElementById('servicesGrid');
    servicesGrid.innerHTML = '';
    
    services.forEach(service => {
        const serviceCard = document.createElement('div');
        serviceCard.className = 'service-card';
        serviceCard.onclick = () => selectService(service.id);
        
        serviceCard.innerHTML = `
            <i class="fas ${service.icon}"></i>
            <h3>${service.name}</h3>
            <p>${service.description}</p>
            <div class="price">от ${service.price.toLocaleString()} ₽</div>
        `;
        
        servicesGrid.appendChild(serviceCard);
    });
}

// Выбор услуги — показываем календарь
function onServiceSelect() {
    const serviceId = document.getElementById('serviceSelect').value;
    const bookingWrapper = document.getElementById('bookingWrapper');
    
    if (serviceId) {
        bookingWrapper.classList.add('has-calendar');
        renderCalendar();
        updatePrice();
        
        if (telegramApp) {
            telegramApp.hapticFeedback('light');
        }
    } else {
        bookingWrapper.classList.remove('has-calendar');
    }
}

// Выбор услуги из карточки
function selectService(serviceId) {
    document.getElementById('serviceSelect').value = serviceId;
    onServiceSelect();
    scrollToBooking();
    
    if (telegramApp) {
        telegramApp.hapticFeedback('success');
    }
}

// Форматирование даты вручную (ДД.ММ.ГГ)
function formatDateInput(input) {
    let value = input.value.replace(/\D/g, '');
    
    if (value.length > 8) {
        value = value.slice(0, 8);
    }
    
    if (value.length > 4) {
        value = value.slice(0, 4) + '.' + value.slice(4);
    }
    if (value.length > 2) {
        value = value.slice(0, 2) + '.' + value.slice(2);
    }
    
    input.value = value;
    
    // Если дата полная — валидируем
    if (value.length === 10) {
        validateManualDate(value);
    }
}

// Валидация ручного ввода даты
function validateManualDate(dateStr) {
    const parts = dateStr.split('.');
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const year = parseInt('20' + parts[2]);
    
    const date = new Date(year, month, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date < today) {
        showError('Выберите будущую дату');
        document.getElementById('bookingDate').value = '';
        return;
    }
    
    if (date.getFullYear() > 2026) {
        showError('Дата не может быть позже 2026 года');
        document.getElementById('bookingDate').value = '';
        return;
    }
    
    selectedDate = date;
    renderCalendar();
}

// Заполнение временных слотов
function fillTimeSlots() {
    const timeSelect = document.getElementById('timeSelect');
    timeSelect.innerHTML = '<option value="">Выберите время...</option>';
    
    for (let hour = 10; hour <= 22; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
            const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            const option = document.createElement('option');
            option.value = time;
            option.textContent = time;
            timeSelect.appendChild(option);
        }
    }
}

// ===== КАЛЕНДАРЬ =====
function renderCalendar() {
    const calendarDays = document.getElementById('calendarDays');
    const calendarMonthYear = document.getElementById('calendarMonthYear');
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Заголовок
    const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
    calendarMonthYear.textContent = `${months[month]} ${year}`;
    
    // Первый день месяца
    const firstDay = new Date(year, month, 1);
    let startDay = firstDay.getDay(); // 0 - Вс, 1 - Пн...
    startDay = startDay === 0 ? 6 : startDay - 1; // Переводим на Пн-Вс
    
    // Количество дней в месяце
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    calendarDays.innerHTML = '';
    
    // Пустые ячейки
    for (let i = 0; i < startDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        calendarDays.appendChild(emptyDay);
    }
    
    // Дни месяца
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        const date = new Date(year, month, day);
        
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;
        
        // Прошедшие дни
        if (date < today) {
            dayElement.classList.add('disabled');
        }
        
        // Дни после 2026 года
        if (year > 2026 || (year === 2026 && month > 11)) {
            dayElement.classList.add('disabled');
        }
        
        // Сегодня
        if (date.getTime() === today.getTime()) {
            dayElement.classList.add('today');
        }
        
        // Выбранный день
        if (selectedDate && 
            date.getDate() === selectedDate.getDate() && 
            date.getMonth() === selectedDate.getMonth() && 
            date.getFullYear() === selectedDate.getFullYear()) {
            dayElement.classList.add('selected');
        }
        
        // Клик по дню
        if (!dayElement.classList.contains('disabled')) {
            dayElement.onclick = () => selectDate(date);
        }
        
        calendarDays.appendChild(dayElement);
    }
}

// Выбор даты в календаре
function selectDate(date) {
    selectedDate = date;
    
    // Записываем в поле
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(2);
    
    document.getElementById('bookingDate').value = `${day}.${month}.${year}`;
    
    renderCalendar();
    
    if (telegramApp) {
        telegramApp.hapticFeedback('light');
    }
}

// Переключение месяца
function changeMonth(direction) {
    currentDate.setMonth(currentDate.getMonth() + direction);
    
    // Ограничение по 2026 год
    if (currentDate.getFullYear() > 2026) {
        currentDate = new Date(2026, 11, 1);
    }
    
    renderCalendar();
}

// Обновление цены
function updatePrice() {
    const serviceSelect = document.getElementById('serviceSelect');
    const hoursSelect = document.getElementById('hoursSelect');
    const selectedServiceId = serviceSelect.value;
    const hours = parseInt(hoursSelect.value) || 1;
    const totalPriceElement = document.getElementById('totalPrice');
    const priceSummary = document.getElementById('priceSummary');
    
    let service = services.find(s => s.id === selectedServiceId);
    
    if (service) {
        let totalPrice = service.price * hours;
        totalPriceElement.textContent = `${totalPrice.toLocaleString()} ₽`;
        priceSummary.style.display = 'flex';
    } else {
        totalPriceElement.textContent = '0 ₽';
        priceSummary.style.display = 'none';
    }
}

// Отправка бронирования
function submitBooking() {
    const date = document.getElementById('bookingDate').value;
    const time = document.getElementById('timeSelect').value;
    const hours = document.getElementById('hoursSelect').value;
    const name = document.getElementById('userName').value;
    const phone = document.getElementById('userPhone').value;
    const service = document.getElementById('serviceSelect').value;
    
    // Валидация
    if (!service) {
        showError('Выберите услугу');
        return;
    }
    
    if (!date || date.length < 10) {
        showError('Выберите дату');
        return;
    }
    
    if (!time) {
        showError('Выберите время');
        return;
    }
    
    if (!name || name.length < 2) {
        showError('Введите ваше имя');
        return;
    }
    
    if (!phone || phone.length < 10) {
        showError('Введите корректный номер телефона');
        return;
    }
    
    // Собираем данные
    const bookingData = {
        service: service,
        date: date,
        time: time,
        hours: hours,
        name: name,
        phone: phone,
        totalPrice: document.getElementById('totalPrice').textContent,
        timestamp: new Date().toISOString()
    };
    
    // Отправляем данные
    if (telegramApp && telegramApp.isTelegram) {
        telegramApp.sendData(bookingData);
        telegramApp.hapticFeedback('success');
        telegramApp.showAlert('Заявка успешно отправлена! Мы свяжемся с вами для подтверждения.');
    } else {
        console.log('Booking data:', bookingData);
        alert('Заявка успешно отправлена! Мы свяжемся с вами для подтверждения.');
    }
    
    // Очищаем форму
    clearForm();
}

function showError(message) {
    if (telegramApp && telegramApp.isTelegram) {
        telegramApp.showAlert(message);
        telegramApp.hapticFeedback('error');
    } else {
        alert(message);
    }
}

function clearForm() {
    document.getElementById('serviceSelect').value = '';
    document.getElementById('bookingDate').value = '';
    document.getElementById('timeSelect').value = '';
    document.getElementById('hoursSelect').value = '1';
    document.getElementById('userPhone').value = '';
    
    selectedDate = null;
    document.getElementById('bookingWrapper').classList.remove('has-calendar');
    
    updatePrice();
}

// Маска телефона
document.addEventListener('DOMContentLoaded', () => {
    loadServices();
    fillTimeSlots();
    
    // Маска для телефона
    const phoneInput = document.getElementById('userPhone');
    phoneInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        
        if (value.startsWith('7') || value.startsWith('8')) {
            value = value.slice(1);
        }
        
        let formatted = '+7 (';
        
        if (value.length > 0) {
            formatted += value.slice(0, 3);
        }
        if (value.length >= 3) {
            formatted += ') ';
            formatted += value.slice(3, 6);
        }
        if (value.length >= 6) {
            formatted += '-' + value.slice(6, 8);
        }
        if (value.length >= 8) {
            formatted += '-' + value.slice(8, 10);
        }
        
        e.target.value = formatted;
    });
});

function scrollToBooking() {
    document.getElementById('booking').scrollIntoView({ behavior: 'smooth' });
}