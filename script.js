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

/**
 * Каталог активов.
 * Каждый актив имеет:
 * - id: уникальный ключ
 * - name: отображаемое имя
 * - cost: стоимость покупки
 * - income: доход в ДОЛЛАРАХ ЗА ЧАС
 * - type: 'rental' | 'investment'
 * - isUnique: true — можно купить 1 раз, false — многократно
 */
const ASSETS = [
  // Аренда (многократная покупка)
  { id: 'studio',     name: '1-комн. квартира',   cost: 100,    income: 10,     type: 'rental',     isUnique: false },
  { id: 'two_room',   name: '2-комн. квартира',   cost: 300,    income: 30,     type: 'rental',     isUnique: false },
  { id: 'three_room', name: '3-комн. квартира',   cost: 800,    income: 80,     type: 'rental',     isUnique: false },
  { id: 'house1',     name: 'Одноэтажный дом',    cost: 2500,   income: 250,    type: 'rental',     isUnique: false },
  { id: 'house2',     name: 'Двухэтажный дом',    cost: 7000,   income: 700,    type: 'rental',     isUnique: false },

  // Инвестиции (уникальные)
  { id: 'savings',        name: 'Сберегательный счёт',     cost: 50,         income: 6,       type: 'investment', isUnique: true },
  { id: 'bonds',          name: 'Государственные облигации', cost: 300,        income: 40,      type: 'investment', isUnique: true },
  { id: 'stocks',         name: 'Акции',                   cost: 2000,       income: 300,     type: 'investment', isUnique: true },
  { id: 'portfolio',      name: 'Фондовый портфель',       cost: 15000,      income: 2500,    type: 'investment', isUnique: true },
  { id: 'hedge_fund',     name: 'Хедж-фонд',               cost: 120000,     income: 22000,   type: 'investment', isUnique: true },
  { id: 'venture',        name: 'Венчурный капитал',       cost: 1000000,    income: 200000,  type: 'investment', isUnique: true },
  { id: 'private_bank',   name: 'Частный банк',            cost: 8000000,    income: 1800000, type: 'investment', isUnique: true },
  { id: 'global_fund',    name: 'Мировой инвестиционный фонд', cost: 60000000, income: 15000000, type: 'investment', isUnique: true }
];

/**
 * =============
 * СОСТОЯНИЕ ИГРЫ
 * =============
 */
let gameState = {
  money: 0,
  taxDebt: 0,
  /** @type {Record<string, number>} количество для неуникальных активов */
  ownedRentals: {},
  /** @type {Record<string, boolean>} куплено/не куплено для уникальных */
  ownedInvestments: {},
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
    gameState.ownedInvestments = parsed.ownedInvestments || {};
    gameState.lastUpdate = Number(parsed.lastUpdate) || Date.now();
  }
}

/**
 * Сбрасывает игру при банкротстве.
 */
function resetGame() {
  alert('❗ У вас недостаточно денег для оплаты налогов!\nВы обанкротились. Игра начнётся заново.');
  gameState = {
    money: 0,
    taxDebt: 0,
    ownedRentals: {},
    ownedInvestments: {},
    lastUpdate: Date.now()
  };
  localStorage.removeItem('gameState');
  updateDisplays();
}

/**
 * =============
 * СИСТЕМА АКТИВОВ
 * =============
 */

/**
 * Возвращает количество купленных единиц актива.
 * @param {string} assetId - ID актива
 * @returns {number}
 */
function getAssetCount(assetId) {
  const asset = ASSETS.find(a => a.id === assetId);
  if (!asset) return 0;
  if (asset.isUnique) {
    return gameState.ownedInvestments[assetId] ? 1 : 0;
  } else {
    return gameState.ownedRentals[assetId] || 0;
  }
}

/**
 * Покупает актив и обновляет UI.
 * @param {string} assetId - ID актива
 */
function buyAsset(assetId) {
  const asset = ASSETS.find(a => a.id === assetId);
  if (!asset || gameState.money < asset.cost) return;

  gameState.money -= asset.cost;

  if (asset.isUnique) {
    gameState.ownedInvestments[assetId] = true;
  } else {
    gameState.ownedRentals[assetId] = (gameState.ownedRentals[assetId] || 0) + 1;
  }

  updateDisplays(); // ⚡ Мгновенное обновление после покупки
  saveGame();
}

/**
 * Рендерит список активов по типу.
 * @param {string} type - 'rental' или 'investment'
 * @param {HTMLElement} container - контейнер для вставки
 */
function renderAssetsByType(type, container) {
  container.innerHTML = '';
  const assetsOfType = ASSETS.filter(asset => asset.type === type);

  assetsOfType.forEach(asset => {
    const count = getAssetCount(asset.id);
    const totalHourly = count * asset.income;
    const canAfford = gameState.money >= asset.cost;
    const isOwned = asset.isUnique && count > 0;

    const el = document.createElement('div');
    el.className = 'asset-item';
    el.innerHTML = `
      <div class="asset-info">
        <h3>${asset.name}</h3>
        <p>Стоимость: $${formatNumber(asset.cost)}</p>
        <p>Доход: $${formatNumber(asset.income)}/час ${asset.isUnique ? '' : 'за шт.'}</p>
        ${asset.isUnique 
          ? (isOwned ? '<p style="color:green; font-weight:bold;">✅ Куплено</p>' : '') 
          : `<p>Куплено: ${count} шт. → Общий доход: $${formatNumber(totalHourly)}/час</p>`
        }
      </div>
      <button class="buy-btn" ${(!canAfford || isOwned) ? 'disabled' : ''}>
        ${isOwned ? 'Куплено' : 'Купить'}
      </button>
    `;

    if (!isOwned) {
      el.querySelector('.buy-btn').addEventListener('click', () => buyAsset(asset.id));
    }

    container.appendChild(el);
  });
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
  return ASSETS.reduce((total, asset) => {
    const count = getAssetCount(asset.id);
    return total + count * asset.income;
  }, 0);
}

/**
 * Рассчитывает доход и налог за период.
 * @param {number} elapsedSec - прошедшее время в секундах
 * @returns {{ income: number, tax: number }}
 */
function calculateIncomeAndTax(elapsedSec) {
  let totalIncome = 0;
  let totalTax = 0;

  ASSETS.forEach(asset => {
    const count = getAssetCount(asset.id);
    const incomePerSec = hourlyToPerSecond(asset.income);
    const income = count * incomePerSec * elapsedSec;
    totalIncome += income;
    totalTax += income * TAX_RATE;
  });

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
const investmentsList = document.getElementById('investments-list');

const clickerContent = document.getElementById('clicker-content');
const rentContent = document.getElementById('rent-content');
const investContent = document.getElementById('invest-content');

const tabClicker = document.getElementById('tab-clicker');
const tabRent = document.getElementById('tab-rent');
const tabInvest = document.getElementById('tab-invest');

const resetDevBtn = document.getElementById('resetDevBtn');

/**
 * Обновляет весь UI.
 */
function updateDisplays() {
  moneyDisplay.textContent = `$${formatNumber(gameState.money)}`;
  incomePerSecDisplay.textContent = `$${formatNumber(getTotalHourlyIncome())}`;
  taxDebtDisplay.textContent = `$${formatNumber(gameState.taxDebt)}`;
  payTaxBtn.disabled = gameState.taxDebt <= 0 || gameState.money < gameState.taxDebt;

  renderAssetsByType('rental', rentalsList);
  renderAssetsByType('investment', investmentsList);
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
    updateDisplays(); // ⚡ Мгновенное обновление
    saveGame();
  }
}

// === Инициализация ===
loadGame();
calculateOfflineIncome();
updateDisplays();
saveGame();

// === Обработчики действий игрока (всегда обновляют UI сразу) ===
clickBtn.addEventListener('click', () => {
  gameState.money += 1;
  updateDisplays(); // ⚡
  saveGame();
});

payTaxBtn.addEventListener('click', payTaxes);

// Временная кнопка сброса (для разработки)
if (resetDevBtn) {
  resetDevBtn.addEventListener('click', () => {
    if (confirm('⚠️ Сбросить игру? Всё прогресс будет удалён.')) {
      resetGame();
    }
  });
}

tabClicker.addEventListener('click', (e) => { e.preventDefault(); switchTab('clicker'); });
tabRent.addEventListener('click', (e) => { e.preventDefault(); switchTab('rent'); });
tabInvest.addEventListener('click', (e) => { e.preventDefault(); switchTab('invest'); });

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