// --- Конфигурация активов ---

const RENTALS = [
  { id: 'studio',     name: '1-комн. квартира',   cost: 100,    income: 10 },
  { id: 'two_room',   name: '2-комн. квартира',   cost: 300,    income: 30 },
  { id: 'three_room', name: '3-комн. квартира',   cost: 800,    income: 80 },
  { id: 'house1',     name: 'Одноэтажный дом',    cost: 2500,   income: 250 },
  { id: 'house2',     name: 'Двухэтажный дом',    cost: 7000,   income: 700 }
];

const INVESTMENTS = [
  { id: 'savings',        name: 'Сберегательный счёт',     cost: 50,         income: 0.5 },
  { id: 'bonds',          name: 'Государственные облигации', cost: 300,        income: 4 },
  { id: 'stocks',         name: 'Акции',                   cost: 2000,       income: 30 },
  { id: 'portfolio',      name: 'Фондовый портфель',       cost: 15000,      income: 250 },
  { id: 'hedge_fund',     name: 'Хедж-фонд',               cost: 120000,     income: 2200 },
  { id: 'venture',        name: 'Венчурный капитал',       cost: 1000000,    income: 20000 },
  { id: 'private_bank',   name: 'Частный банк',            cost: 8000000,    income: 180000 },
  { id: 'global_fund',    name: 'Мировой инвестиционный фонд', cost: 60000000, income: 1500000 }
];

// --- Игровое состояние ---
let gameState = {
  money: 0,
  ownedRentals: {},       // теперь: { studio: 3, house1: 1, ... }
  ownedInvestments: {},   // остаётся уникальным (покупка один раз)
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

// --- Расчёт общего дохода ---
function getTotalIncomePerSecond() {
  let total = 0;

  // Аренда: количество × доход на единицу
  RENTALS.forEach(item => {
    const count = gameState.ownedRentals[item.id] || 0;
    total += count * item.income;
  });

  // Инвестиции: только куплено/не куплено
  INVESTMENTS.forEach(inv => {
    if (gameState.ownedInvestments[inv.id]) total += inv.income;
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
    const totalIncome = count * item.income;
    const canAfford = gameState.money >= item.cost;

    const el = document.createElement('div');
    el.className = 'asset-item';
    el.innerHTML = `
      <div class="asset-info">
        <h3>${item.name}</h3>
        <p>Стоимость: $${formatNumber(item.cost)}</p>
        <p>Доход за шт.: $${formatNumber(item.income)}/сек</p>
        <p>Куплено: ${count} шт. → Общий доход: $${formatNumber(totalIncome)}/сек</p>
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

// --- Рендер инвестиций (без изменений) ---
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
        <p>Доход: $${formatNumber(inv.income)}/сек</p>
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
  incomePerSecDisplay.textContent = `$${formatNumber(getTotalIncomePerSecond())}`;
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

// --- Онлайн-доход каждые 3 секунды ---
setInterval(() => {
  const income = getTotalIncomePerSecond();
  if (income > 0) {
    gameState.money += income;
    updateDisplays();
    saveGame();
  }
}, 1000);