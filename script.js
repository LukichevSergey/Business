/**
 * =============
 * КОНФИГУРАЦИЯ
 * =============
 */

/** @constant {number} Налоговая ставка (10%) */
const TAX_RATE = 0.1;

/** @constant {number} Порог принудительного списания налога (в $) */
const TAX_ENFORCEMENT_THRESHOLD = 100;

/** @constant {number} Интервал автоматического обновления UI в миллисекундах */
const UI_UPDATE_INTERVAL_MS = 3000; // 3 секунды

/** @constant {number} Множитель для перевода дохода в час → в секунду */
const HOURS_TO_SECONDS = 3600;

/** @constant {Object} Годовые ставки доходности для инвестиций */
const INVESTMENT_RATES = {
  stocks: 0.20, // 20% годовых
  bonds: 0.10,  // 10% годовых
  funds: 0.15   // 15% годовых
};

/**
 * Каталог активов аренды.
 * Только тип 'rental', isUnique: false (многократная покупка)
 */
const ASSETS = [
  { id: 'studio',     name: '1-комн. квартира',   cost: 100,    income: 10,     type: 'rental', isUnique: false },
  { id: 'two_room',   name: '2-комн. квартира',   cost: 300,    income: 30,     type: 'rental', isUnique: false },
  { id: 'three_room', name: '3-комн. квартира',   cost: 800,    income: 80,     type: 'rental', isUnique: false },
  { id: 'house1',     name: 'Одноэтажный дом',    cost: 2500,   income: 250,    type: 'rental', isUnique: false },
  { id: 'house2',     name: 'Двухэтажный дом',    cost: 7000,   income: 700,    type: 'rental', isUnique: false }
];

/**
 * =============
 * СОСТОЯНИЕ ИГРЫ
 * =============
 */
let gameState = {
  money: 0,
  taxDebt: 0,
  /** @type {Record<string, number>} количество арендованных объектов */
  ownedRentals: {},
  /** @type {Object} балансы по инвестициям */
  investments: {
    stocks: 0,
    bonds: 0,
    funds: 0
  },
  lastUpdate: Date.now()
};

/**
 * =============
 * ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
 * =============
 */

/**
 * Форматирует число с разделителем тысяч и 2 знаками после запятой.
 * @param {number} num - число для форматирования
 * @returns {string}
 */
function formatNumber(num) {
  return num.toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Конвертирует доход в час → в секунду.
 * @param {number} hourly - доход в час
 * @returns {number}
 */
function hourlyToPerSecond(hourly) {
  return hourly / HOURS_TO_SECONDS;
}

/**
 * Сохраняет игру в localStorage.
 */
function saveGame() {
  gameState.lastUpdate = Date.now();
  localStorage.setItem('gameState', JSON.stringify(gameState));
}

/**
 * Загружает игру из localStorage.
 */
function loadGame() {
  const saved = localStorage.getItem('gameState');
  if (saved) {
    const parsed = JSON.parse(saved);
    gameState.money = parseFloat(parsed.money) || 0;
    gameState.taxDebt = parseFloat(parsed.taxDebt) || 0;
    gameState.ownedRentals = parsed.ownedRentals || {};
    gameState.investments = {
      stocks: parseFloat(parsed.investments?.stocks) || 0,
      bonds: parseFloat(parsed.investments?.bonds) || 0,
      funds: parseFloat(parsed.investments?.funds) || 0
    };
    gameState.lastUpdate = Number(parsed.lastUpdate) || Date.now();
  }
}

/**
 * Сбрасывает игру при банкротстве или по кнопке.
 */
function resetGame() {
  if (!confirm('⚠️ Сбросить игру? Весь прогресс будет удалён.')) return;
  gameState = {
    money: 0,
    taxDebt: 0,
    ownedRentals: {},
    investments: { stocks: 0, bonds: 0, funds: 0 },
    lastUpdate: Date.now()
  };
  localStorage.removeItem('gameState');
  updateDisplays();
}

/**
 * =============
 * СИСТЕМА АРЕНДЫ
 * =============
 */

/**
 * Возвращает количество купленных единиц актива.
 * @param {string} assetId - ID актива
 * @returns {number}
 */
function getAssetCount(assetId) {
  return gameState.ownedRentals[assetId] || 0;
}

/**
 * Покупает актив аренды и обновляет UI.
 * @param {string} assetId - ID актива
 */
function buyAsset(assetId) {
  const asset = ASSETS.find(a => a.id === assetId);
  if (!asset || gameState.money < asset.cost) return;

  gameState.money -= asset.cost;
  gameState.ownedRentals[assetId] = (gameState.ownedRentals[assetId] || 0) + 1;

  updateDisplays(); // ⚡ Мгновенное обновление
  saveGame();
}

/**
 * Рендерит список активов аренды.
 * @param {HTMLElement} container - контейнер для вставки
 */
function renderRentals(container) {
  container.innerHTML = '';

  ASSETS.forEach(asset => {
    const count = getAssetCount(asset.id);
    const totalHourly = count * asset.income;
    const canAfford = gameState.money >= asset.cost;

    const el = document.createElement('div');
    el.className = 'asset-item';
    el.innerHTML = `
      <div class="asset-info">
        <h3>${asset.name}</h3>
        <p>Стоимость: $${formatNumber(asset.cost)}</p>
        <p>Доход: $${formatNumber(asset.income)}/час за шт.</p>
        <p>Куплено: ${count} шт. → Общий доход: $${formatNumber(totalHourly)}/час</p>
      </div>
      <button class="buy-btn" ${!canAfford ? 'disabled' : ''}>
        Купить
      </button>
    `;

    el.querySelector('.buy-btn').addEventListener('click', () => buyAsset(asset.id));
    container.appendChild(el);
  });
}

/**
 * =============
 * СИСТЕМА ИНВЕСТИЦИЙ
 * =============
 */

/**
 * Вложить деньги в инвестицию.
 * @param {string} type - 'stocks', 'bonds', 'funds'
 * @param {number} amount - сумма
 */
function invest(type, amount) {
  if (amount <= 0 || isNaN(amount)) return;
  if (gameState.money < amount) {
    alert('Недостаточно средств!');
    return;
  }
  gameState.money -= amount;
  gameState.investments[type] += amount;
  updateDisplays();
  saveGame();
}

/**
 * Снять деньги из инвестиции.
 * @param {string} type - 'stocks', 'bonds', 'funds'
 * @param {number} amount - сумма
 */
function withdraw(type, amount) {
  if (amount <= 0 || isNaN(amount)) return;
  if (gameState.investments[type] < amount) {
    alert('Недостаточно средств в инвестиции!');
    return;
  }
  gameState.investments[type] -= amount;
  gameState.money += amount;
  updateDisplays();
  saveGame();
}

/**
 * =============
 * ФИНАНСОВАЯ СИСТЕМА
 * =============
 */

/**
 * Рассчитывает общий доход в час.
 * @returns {number}
 */
function getTotalHourlyIncome() {
  let total = 0;

  // Аренда
  ASSETS.forEach(asset => {
    const count = getAssetCount(asset.id);
    total += count * asset.income;
  });

  // Инвестиции: доход в час = баланс * ставка / 365 / 24
  for (const [key, balance] of Object.entries(gameState.investments)) {
    const annualRate = INVESTMENT_RATES[key] || 0;
    total += balance * annualRate / 365 / 24;
  }

  return total;
}

/**
 * Рассчитывает доход и налог за период.
 * @param {number} elapsedSec - прошедшее время в секундах
 * @returns {{ income: number, tax: number }}
 */
function calculateIncomeAndTax(elapsedSec) {
  let totalIncome = 0;
  let totalTax = 0;

  // Доход от аренды
  ASSETS.forEach(asset => {
    const count = getAssetCount(asset.id);
    const incomePerSec = hourlyToPerSecond(asset.income);
    const income = count * incomePerSec * elapsedSec;
    totalIncome += income;
    totalTax += income * TAX_RATE;
  });

  // Доход от инвестиций
  for (const [key, balance] of Object.entries(gameState.investments)) {
    if (balance > 0) {
      const annualRate = INVESTMENT_RATES[key] || 0;
      const incomePerSec = balance * annualRate / (365 * 24 * 3600);
      const income = incomePerSec * elapsedSec;
      totalIncome += income;
      totalTax += income * TAX_RATE;
    }
  }

  return { income: totalIncome, tax: totalTax };
}

/**
 * Начисляет оффлайн-доход и налог.
 */
function calculateOfflineIncome() {
  const now = Date.now();
  const elapsedSec = (now - gameState.lastUpdate) / 1000;
  const { income, tax } = calculateIncomeAndTax(elapsedSec);
  gameState.money += income;
  gameState.taxDebt += tax;
  gameState.lastUpdate = now;
}

/**
 * Принудительно списывает налог.
 */
function enforceTaxPayment() {
  if (gameState.taxDebt <= 0) return;

  if (gameState.money >= gameState.taxDebt) {
    gameState.money -= gameState.taxDebt;
    gameState.taxDebt = 0;
  } else {
    resetGame();
  }
}

/**
 * =============
 * UI И ИГРОВОЙ ЦИКЛ
 * =============
 */

// DOM элементы
const moneyDisplay = document.getElementById('money');
const incomePerSecDisplay = document.getElementById('incomePerSec');
const taxDebtDisplay = document.getElementById('taxDebt');
const payTaxBtn = document.getElementById('payTaxBtn');
const clickBtn = document.getElementById('clickBtn');
const rentalsList = document.getElementById('rentals-list');

// Кнопка сброса (для разработки)
const resetDevBtn = document.getElementById('resetDevBtn');

// Вкладки
const clickerContent = document.getElementById('clicker-content');
const rentContent = document.getElementById('rent-content');
const investContent = document.getElementById('invest-content');

const tabClicker = document.getElementById('tab-clicker');
const tabRent = document.getElementById('tab-rent');
const tabInvest = document.getElementById('tab-invest');

/**
 * Обновляет весь UI.
 */
function updateDisplays() {
  moneyDisplay.textContent = `$${formatNumber(gameState.money)}`;
  incomePerSecDisplay.textContent = `$${formatNumber(getTotalHourlyIncome())}`;
  taxDebtDisplay.textContent = `$${formatNumber(gameState.taxDebt)}`;
  payTaxBtn.disabled = gameState.taxDebt <= 0 || gameState.money < gameState.taxDebt;

  // Аренда
  renderRentals(rentalsList);

  // Инвестиции — обновляем вручную
  document.getElementById('stocksBalance').textContent = formatNumber(gameState.investments.stocks);
  document.getElementById('bondsBalance').textContent = formatNumber(gameState.investments.bonds);
  document.getElementById('fundsBalance').textContent = formatNumber(gameState.investments.funds);

  const stocksHourly = gameState.investments.stocks * INVESTMENT_RATES.stocks / 365 / 24;
  const bondsHourly = gameState.investments.bonds * INVESTMENT_RATES.bonds / 365 / 24;
  const fundsHourly = gameState.investments.funds * INVESTMENT_RATES.funds / 365 / 24;

  document.getElementById('stocksIncome').textContent = formatNumber(stocksHourly);
  document.getElementById('bondsIncome').textContent = formatNumber(bondsHourly);
  document.getElementById('fundsIncome').textContent = formatNumber(fundsHourly);
}

/**
 * Переключает вкладку.
 * @param {string} tabName - 'clicker', 'rent', 'invest'
 */
function switchTab(tabName) {
  clickerContent.classList.toggle('active', tabName === 'clicker');
  rentContent.classList.toggle('active', tabName === 'rent');
  investContent.classList.toggle('active', tabName === 'invest');

  tabClicker.classList.toggle('active', tabName === 'clicker');
  tabRent.classList.toggle('active', tabName === 'rent');
  tabInvest.classList.toggle('active', tabName === 'invest');
}

/**
 * Ручная оплата налогов.
 */
function payTaxes() {
  if (gameState.taxDebt > 0 && gameState.money >= gameState.taxDebt) {
    gameState.money -= gameState.taxDebt;
    gameState.taxDebt = 0;
    updateDisplays();
    saveGame();
  }
}

// === Инициализация ===
loadGame();
calculateOfflineIncome();
updateDisplays();
saveGame();

// === Обработчики действий игрока ===
clickBtn.addEventListener('click', () => {
  gameState.money += 1;
  updateDisplays();
  saveGame();
});

payTaxBtn.addEventListener('click', payTaxes);

// Вкладки
tabClicker.addEventListener('click', (e) => { e.preventDefault(); switchTab('clicker'); });
tabRent.addEventListener('click', (e) => { e.preventDefault(); switchTab('rent'); });
tabInvest.addEventListener('click', (e) => { e.preventDefault(); switchTab('invest'); });

// Инвестиции
document.getElementById('stocksInvest').addEventListener('click', () => {
  const amount = parseFloat(document.getElementById('stocksInput').value);
  invest('stocks', amount);
  document.getElementById('stocksInput').value = '';
});

document.getElementById('stocksWithdraw').addEventListener('click', () => {
  const amount = parseFloat(document.getElementById('stocksInput').value);
  withdraw('stocks', amount);
  document.getElementById('stocksInput').value = '';
});

document.getElementById('bondsInvest').addEventListener('click', () => {
  const amount = parseFloat(document.getElementById('bondsInput').value);
  invest('bonds', amount);
  document.getElementById('bondsInput').value = '';
});

document.getElementById('bondsWithdraw').addEventListener('click', () => {
  const amount = parseFloat(document.getElementById('bondsInput').value);
  withdraw('bonds', amount);
  document.getElementById('bondsInput').value = '';
});

document.getElementById('fundsInvest').addEventListener('click', () => {
  const amount = parseFloat(document.getElementById('fundsInput').value);
  invest('funds', amount);
  document.getElementById('fundsInput').value = '';
});

document.getElementById('fundsWithdraw').addEventListener('click', () => {
  const amount = parseFloat(document.getElementById('fundsInput').value);
  withdraw('funds', amount);
  document.getElementById('fundsInput').value = '';
});

// Кнопка сброса (для разработки)
if (resetDevBtn) {
  resetDevBtn.addEventListener('click', resetGame);
}

// === Точный расчёт каждую секунду (фон) ===
setInterval(() => {
  const now = Date.now();
  const elapsedSec = (now - gameState.lastUpdate) / 1000;
  if (elapsedSec >= 1) {
    const { income, tax } = calculateIncomeAndTax(elapsedSec);
    gameState.money += income;
    gameState.taxDebt += tax;
    gameState.lastUpdate = now;

    if (gameState.taxDebt >= TAX_ENFORCEMENT_THRESHOLD) {
      enforceTaxPayment();
    }

    saveGame();
  }
}, 1000);

// === Автоматическое обновление UI (редко) ===
setInterval(updateDisplays, UI_UPDATE_INTERVAL_MS);