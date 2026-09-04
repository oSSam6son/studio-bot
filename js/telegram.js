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
        this.setupMainButton();
        this.getUserData();
        
        document.body.classList.add('telegram-app');
    }
    
    setupTheme() {
        this.tg.setHeaderColor('#0a0a0a');
        this.tg.setBackgroundColor('#0a0a0a');
        this.tg.setBottomBarColor('#0a0a0a');
    }
    
    setupMainButton() {
        this.tg.MainButton.setText('ЗАБРОНИРОВАТЬ')
            .show()
            .onClick(() => {
                scrollToBooking();
            });
    }
    
    getUserData() {
        const user = this.tg.initDataUnsafe?.user;
        
        if (user) {
            const nameInput = document.getElementById('userName');
            if (nameInput && user.first_name) {
                nameInput.value = user.first_name + (user.last_name ? ' ' + user.last_name : '');
            }
        }
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
    
    hapticFeedback(type = 'success') {
        if (this.isTelegram && this.tg.HapticFeedback) {
            this.tg.HapticFeedback.notificationOccurred(type);
        }
    }
}

const telegramApp = new TelegramIntegration();

function scrollToBooking() {
    document.getElementById('booking').scrollIntoView({ behavior: 'smooth' });
}

function scrollToGallery() {
    document.getElementById('gallery').scrollIntoView({ behavior: 'smooth' });
}

function scrollToTop(event) {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleMenu() {
    document.getElementById('nav').classList.toggle('active');
}