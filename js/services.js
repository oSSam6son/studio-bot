const services = [
  {
    id: "recording",
    name: "Запись вокала",
    description: "Профессиональная запись с звукорежиссёром",
    price: 2500,
    icon: "fa-microphone",
  },
  {
    id: "mixing",
    name: "Сведение",
    description: "Многоканальное сведение трека",
    price: 5000,
    icon: "fa-sliders",
  },
  {
    id: "mastering",
    name: "Мастеринг",
    description: "Финальная обработка трека",
    price: 3000,
    icon: "fa-wave-square",
  },
  {
    id: "full",
    name: "Под ключ",
    description: "Запись + сведение + мастеринг",
    price: 15000,
    icon: "fa-music",
  },
  {
    id: "rehearsal",
    name: "Репетиция",
    description: "Аренда студии для репетиции",
    price: 1500,
    icon: "fa-guitar",
  },
];

function loadServices() {
  const servicesGrid = document.getElementById("servicesGrid");
  servicesGrid.innerHTML = "";

  services.forEach((service) => {
    const serviceCard = document.createElement("div");
    serviceCard.className = "service-card";

    serviceCard.innerHTML = `
            <i class="fas ${service.icon}"></i>
            <h3>${service.name}</h3>
            <p>${service.description}</p>
            <div class="price">от ${service.price.toLocaleString()} ₽</div>
            <a href="booking.html?service=${service.id}" class="btn-book-service">
                Записаться
            </a>
        `;

    servicesGrid.appendChild(serviceCard);
  });
}

document.addEventListener("DOMContentLoaded", loadServices);
