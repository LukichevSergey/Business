// --- Конфигурация активов ---
// income = доход в ДОЛЛАРАХ ЗА ЧАС

const RENTALS = [
  { id: 'studio',     name: '1-комн. квартира',   cost: 100,    income: 10 },
  { id: 'two_room',   name: '2-комн. квартира',   cost: 300,    income: 30 },
  { id: 'three_room', name: '3-комн. квартира',   cost: 800,    income: 80 },
  { id: 'house1',     name: 'Одноэтажный дом',    cost: 2500,   income: 250 },
  { id: 'house2',     name: 'Двухэтажный дом',    cost: 7000,   income: 700 }
];

const INVESTMENTS = [
  { id: 'savings',        name: 'Сберегательный счёт',     cost: 50,         income: 6 },       // ROI ~8.3 ч
  { id: 'bonds',          name: 'Государственные облигации', cost: 300,        income: 40 },      // ROI ~7.5 ч
  { id: 'stocks',         name: 'Акции',                   cost: 2000,       income: 300 },     // ROI ~6.7 ч
  { id: 'portfolio',      name: 'Фондовый портфель',       cost: 15000,      income: 2500 },    // ROI ~6 ч
  { id: 'hedge_fund',     name: 'Хедж-фонд',               cost: 120000,     income: 22000 },   // ROI ~5.5 ч
  { id: 'venture',        name: 'Венчурный капитал',       cost: 1000000,    income: 200000 },  // ROI ~5 ч
  { id: 'private_bank',   name: 'Частный банк',            cost: 8000000,    income: 1800000 }, // ROI ~4.4 ч
  { id: 'global_fund',    name: 'Мировой инвестиционный фонд', cost: 60000000, income: 15000000 } // ROI ~4 ч
];

// --- Игровое состояние ---
let gameState = {
  money: 0,
  ownedRentals: {},
  ownedInvestments: {},
  lastUpdate: Date.now()
};

// --- Форматирование чисел ---
function formatNumber(num) {
  return num.toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// --- DOM элементы ---
const moneyDisplay = document.getElementById('money');
const incomePerSecDisplay = document.getElementById('incomePerSec');
const clickBtn = document.getElementById('clickBtn');
const rentalsList = document.getElementById('rentals-list');
const investmentsList = document.getElementById('investments-list');

const clickerContent = document.getElementById('clicker-content');
const rentContent = document.getElementById('rent-content');
const investContent = document.getElementById('invest-content');

const tabClicker = document.getElementById('tab-clicker');
const tabRent = document.getElementById('tab-rent');
const tabInvest = document.getElementById('tab-invest');

// --- Вспомогательная функция: доход в секунду из дохода в час ---
function hourlyToPerSecond(hourly) {
  return hourly / 3600;
}

// --- Сохранение и загрузка ---
function saveGame() {
  gameState.lastUpdate = Date.now();
  localStorage.setItem('gameState', JSON.stringify(gameState));
}

function loadGame() {
  const saved = localStorage.getItem('gameState');
  if (saved) {
    const parsed = JSON.parse(saved);
    gameState.money = parseFloat(parsed.money) || 0;
    gameState.ownedRentals = parsed.ownedRentals || {};
    gameState.ownedInvestments = parsed.ownedInvestments || {};
    gameState.lastUpdate = Number(parsed.lastUpdate) || Date.now();
  }
}

// --- Общий доход в секунду ---
function getTotalIncomePerSecond() {
  let total = 0;

  RENTALS.forEach(item => {
    const count = gameState.ownedRentals[item.id] || 0;
    total += count * hourlyToPerSecond(item.income);
  });

  INVESTMENTS.forEach(inv => {
    if (gameState.ownedInvestments[inv.id]) {
      total += hourlyToPerSecond(inv.income);
    }
  });

  return total;
}

// --- Оффлайн-доход ---
function calculateOfflineIncome() {
  const now = Date.now();
  const elapsedSec = (now - gameState.lastUpdate) / 1000;
  const income = getTotalIncomePerSecond() * elapsedSec;
  gameState.money += income;
  gameState.lastUpdate = now;
}

// --- Рендер аренды ---
function renderRentals() {
  rentalsList.innerHTML = '';
  RENTALS.forEach(item => {
    const count = gameState.ownedRentals[item.id] || 0;
    const totalHourly = count * item.income;
    const canAfford = gameState.money >= item.cost;

    const el = document.createElement('div');
    el.className = 'asset-item';
    el.innerHTML = `
      <div class="asset-info">
        <h3>${item.name}</h3>
        <p>Стоимость: $${formatNumber(item.cost)}</p>
        <p>Доход: $${formatNumber(item.income)}/час за шт.</p>
        <p>Куплено: ${count} шт. → Общий доход: $${formatNumber(totalHourly)}/час</p>
      </div>
      <button class="buy-btn" ${!canAfford ? 'disabled' : ''}>
        Купить
      </button>
    `;

    el.querySelector('.buy-btn').addEventListener('click', () => {
      if (gameState.money >= item.cost) {
        gameState.money -= item.cost;
        gameState.ownedRentals[item.id] = (gameState.ownedRentals[item.id] || 0) + 1;
        updateDisplays();
        saveGame();
      }
    });

    rentalsList.appendChild(el);
  });
}

// --- Рендер инвестиций ---
function renderInvestments() {
  investmentsList.innerHTML = '';
  INVESTMENTS.forEach(inv => {
    const isOwned = gameState.ownedInvestments[inv.id] === true;
    const canAfford = gameState.money >= inv.cost && !isOwned;

    const el = document.createElement('div');
    el.className = 'asset-item';
    el.innerHTML = `
      <div class="asset-info">
        <h3>${inv.name}</h3>
        <p>Стоимость: $${formatNumber(inv.cost)}</p>
        <p>Доход: $${formatNumber(inv.income)}/час</p>
        ${isOwned ? '<p style="color:green; font-weight:bold;">✅ Куплено</p>' : ''}
      </div>
      <button class="buy-btn" ${isOwned || !canAfford ? 'disabled' : ''}>
        ${isOwned ? 'Куплено' : 'Купить'}
      </button>
    `;

    if (!isOwned) {
      el.querySelector('.buy-btn').addEventListener('click', () => {
        if (gameState.money >= inv.cost) {
          gameState.money -= inv.cost;
          gameState.ownedInvestments[inv.id] = true;
          updateDisplays();
          saveGame();
        }
      });
    }

    investmentsList.appendChild(el);
  });
}

// --- Обновление интерфейса ---
function updateDisplays() {
  moneyDisplay.textContent = `$${formatNumber(gameState.money)}`;
  // Отображаем общий доход в час (чтобы игроку было понятно)
  const totalHourly = getTotalIncomePerSecond() * 3600;
  incomePerSecDisplay.textContent = `$${formatNumber(totalHourly)}`;
  renderRentals();
  renderInvestments();
}

// --- Переключение вкладок ---
function switchTab(tabName) {
  clickerContent.classList.toggle('active', tabName === 'clicker');
  rentContent.classList.toggle('active', tabName === 'rent');
  investContent.classList.toggle('active', tabName === 'invest');

  tabClicker.classList.toggle('active', tabName === 'clicker');
  tabRent.classList.toggle('active', tabName === 'rent');
  tabInvest.classList.toggle('active', tabName === 'invest');
}

// --- Инициализация ---
loadGame();
calculateOfflineIncome();
updateDisplays();
saveGame();

// --- Обработчики ---
clickBtn.addEventListener('click', () => {
  gameState.money += 1;
  updateDisplays();
  saveGame();
});

tabClicker.addEventListener('click', (e) => { e.preventDefault(); switchTab('clicker'); });
tabRent.addEventListener('click', (e) => { e.preventDefault(); switchTab('rent'); });
tabInvest.addEventListener('click', (e) => { e.preventDefault(); switchTab('invest'); });

// --- Онлайн-доход каждую секунду ---
setInterval(() => {
  const income = getTotalIncomePerSecond();
  if (income > 0) {
    gameState.money += income;
    updateDisplays();
    saveGame();
  }
}, 1000);