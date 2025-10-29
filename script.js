// --- Конфигурация домов ---
const HOUSES = [
    { id: 'hut', name: 'Хижина', cost: 20, income: 0.1 },
    { id: 'apartment', name: 'Квартира', cost: 100, income: 0.5 },
    { id: 'townhouse', name: 'Таунхаус', cost: 500, income: 2 },
    { id: 'villa', name: 'Вилла', cost: 2000, income: 8 }
  ];
  
  // --- Игровое состояние ---
  let gameState = {
    money: 0,
    ownedHouses: {}, // например: { hut: true, apartment: false }
    lastUpdate: Date.now()
  };
  
  // --- DOM элементы ---
  const moneyDisplay = document.getElementById('money');
  const clickBtn = document.getElementById('clickBtn');
  const housesList = document.getElementById('houses-list');
  
  const clickerContent = document.getElementById('clicker-content');
  const rentContent = document.getElementById('rent-content');
  
  const tabClicker = document.getElementById('tab-clicker');
  const tabRent = document.getElementById('tab-rent');
  
  // --- Вспомогательные функции ---
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
      gameState.lastUpdate = Number(parsed.lastUpdate) || Date.now();
    }
  }
  
  function getTotalIncomePerSecond() {
    let total = 0;
    HOUSES.forEach(house => {
      if (gameState.ownedHouses[house.id]) {
        total += house.income;
      }
    });
    return total;
  }
  
  function calculateOfflineIncome() {
    const now = Date.now();
    const elapsedSec = (now - gameState.lastUpdate) / 1000;
    const income = getTotalIncomePerSecond() * elapsedSec;
    gameState.money += income;
    gameState.lastUpdate = now;
  }
  
  function updateDisplays() {
    moneyDisplay.textContent = `Деньги: $${gameState.money.toFixed(2)}`;
    renderHouses();
  }
  
  function renderHouses() {
    housesList.innerHTML = '';
    HOUSES.forEach(house => {
      const isOwned = gameState.ownedHouses[house.id] === true;
      const canAfford = gameState.money >= house.cost && !isOwned;
  
      const houseEl = document.createElement('div');
      houseEl.className = 'house-item';
  
      houseEl.innerHTML = `
        <div class="house-info">
          <h3>${house.name}</h3>
          <p>Стоимость: $${house.cost}</p>
          <p>Доход: $${house.income}/сек</p>
          ${isOwned ? '<p style="color:green; font-weight:bold;">✅ Куплено</p>' : ''}
        </div>
        <button class="buy-btn" ${isOwned || !canAfford ? 'disabled' : ''}>
          ${isOwned ? 'Куплено' : 'Купить'}
        </button>
      `;
  
      const buyBtn = houseEl.querySelector('.buy-btn');
      if (!isOwned) {
        buyBtn.addEventListener('click', () => {
          if (gameState.money >= house.cost) {
            gameState.money -= house.cost;
            gameState.ownedHouses[house.id] = true;
            updateDisplays();
            saveGame();
          }
        });
      }
  
      housesList.appendChild(houseEl);
    });
  }
  
  function switchTab(tabName) {
    clickerContent.classList.toggle('active', tabName === 'clicker');
    rentContent.classList.toggle('active', tabName === 'rent');
    tabClicker.classList.toggle('active', tabName === 'clicker');
    tabRent.classList.toggle('active', tabName === 'rent');
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
  
  tabClicker.addEventListener('click', (e) => {
    e.preventDefault();
    switchTab('clicker');
  });
  
  tabRent.addEventListener('click', (e) => {
    e.preventDefault();
    switchTab('rent');
  });
  
  // --- Онлайн-доход каждую секунду ---
  setInterval(() => {
    const income = getTotalIncomePerSecond();
    if (income > 0) {
      gameState.money += income;
      updateDisplays();
      saveGame();
    }
  }, 1000);