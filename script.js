// --- Конфигурация активов ---

const HOUSES = [
    { id: 'hut',          name: 'Хижина',             cost: 20,        income: 0.67 },
    { id: 'apartment',    name: 'Квартира',           cost: 100,       income: 3.33 },
    { id: 'townhouse',    name: 'Таунхаус',           cost: 500,       income: 16.67 },
    { id: 'villa',        name: 'Вилла',              cost: 2500,      income: 83.33 },
    { id: 'mansion',      name: 'Особняк',            cost: 12500,     income: 416.67 },
    { id: 'skyscraper',   name: 'Небоскрёб',          cost: 62500,     income: 2083.33 },
    { id: 'hotel',        name: 'Гостиничный комплекс', cost: 312500,    income: 10416.67 },
    { id: 'resort',       name: 'Курорт',             cost: 1562500,   income: 52083.33 },
    { id: 'cityblock',    name: 'Квартал',            cost: 7812500,   income: 260416.67 },
    { id: 'megacity',     name: 'Мегаполис',          cost: 39062500,  income: 1302083.33 },
    { id: 'orbital',      name: 'Орбитальный модуль',  cost: 195312500, income: 6510416.67 },
    { id: 'galaxy',       name: 'Галактическая резиденция', cost: 976562500, income: 32552083.33 }
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
    ownedHouses: {},
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
  const housesList = document.getElementById('houses-list');
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
      gameState.ownedHouses = parsed.ownedHouses || {};
      gameState.ownedInvestments = parsed.ownedInvestments || {};
      gameState.lastUpdate = Number(parsed.lastUpdate) || Date.now();
    }
  }
  
  // --- Расчёт общего дохода ---
  function getTotalIncomePerSecond() {
    let total = 0;
  
    HOUSES.forEach(house => {
      if (gameState.ownedHouses[house.id]) total += house.income;
    });
  
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
  
  // --- Рендер активов ---
  function renderHouses() {
    housesList.innerHTML = '';
    HOUSES.forEach(house => {
      const isOwned = gameState.ownedHouses[house.id] === true;
      const canAfford = gameState.money >= house.cost && !isOwned;
  
      const el = document.createElement('div');
      el.className = 'asset-item';
      el.innerHTML = `
        <div class="asset-info">
          <h3>${house.name}</h3>
          <p>Стоимость: $${formatNumber(house.cost)}</p>
          <p>Доход: $${formatNumber(house.income)}/сек</p>
          ${isOwned ? '<p style="color:green; font-weight:bold;">✅ Куплено</p>' : ''}
        </div>
        <button class="buy-btn" ${isOwned || !canAfford ? 'disabled' : ''}>
          ${isOwned ? 'Куплено' : 'Купить'}
        </button>
      `;
  
      if (!isOwned) {
        el.querySelector('.buy-btn').addEventListener('click', () => {
          if (gameState.money >= house.cost) {
            gameState.money -= house.cost;
            gameState.ownedHouses[house.id] = true;
            updateDisplays();
            saveGame();
          }
        });
      }
  
      housesList.appendChild(el);
    });
  }
  
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
    renderHouses();
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