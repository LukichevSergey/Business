/**
 * =============
 * КОНФИГУРАЦИЯ
 * =============
 */

const TAX_RATE = 0.1;
const TAX_ENFORCEMENT_THRESHOLD = 100;
const UI_UPDATE_INTERVAL_MS = 3000;
const HOURS_TO_SECONDS = 3600;

const INVESTMENT_RATES = {
  stocks: 0.20,
  bonds: 0.10,
  funds: 0.15
};

const BASE_DAILY_INCOME = 10;
const MAX_STREAK_INCOME = 20;
const MAX_STREAK_DAYS = 10;
const WORK_DURATION_SEC = 10;

const EDUCATION_INCOME = {
  none: 0,
  basic: 20,
  secondary: 30,
  higher: 50
};

const EDUCATION_DURATION = {
  basic: 120,
  secondary: 300,
  higher: 600
};

const ASSETS = [
  { id: 'studio',     name: '1-комн. квартира',   cost: 100,    income: 10,     type: 'rental', isUnique: false },
  { id: 'two_room',   name: '2-комн. квартира',   cost: 300,    income: 30,     type: 'rental', isUnique: false },
  { id: 'three_room', name: '3-комн. квартира',   cost: 800,    income: 80,     type: 'rental', isUnique: false },
  { id: 'house1',     name: 'Одноэтажный дом',    cost: 2500,   income: 250,    type: 'rental', isUnique: false },
  { id: 'house2',     name: 'Двухэтажный дом',    cost: 7000,   income: 700,    type: 'rental', isUnique: false }
];

let gameState = {
  money: 0,
  taxDebt: 0,
  ownedRentals: {},
  investments: { stocks: 0, bonds: 0, funds: 0 },
  education: 'none',
  lastWorkTimestamp: 0,
  currentStreakDays: 0,
  workSessionEnd: 0,
  studySessionEnd: 0,
  lastUpdate: Date.now()
};

function formatNumber(num) {
  return num.toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function hourlyToPerSecond(hourly) {
  return hourly / HOURS_TO_SECONDS;
}

function saveGame() {
  gameState.lastUpdate = Date.now();
  localStorage.setItem('gameState', JSON.stringify(gameState));
}

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
    gameState.education = parsed.education || 'none';
    gameState.lastWorkTimestamp = Number(parsed.lastWorkTimestamp) || 0;
    gameState.currentStreakDays = parseInt(parsed.currentStreakDays) || 0;
    gameState.workSessionEnd = Number(parsed.workSessionEnd) || 0;
    gameState.studySessionEnd = Number(parsed.studySessionEnd) || 0;
    gameState.lastUpdate = Number(parsed.lastUpdate) || Date.now();
  }
}

function resetGame() {
  if (!confirm('⚠️ Сбросить игру? Весь прогресс будет удалён.')) return;
  gameState = {
    money: 0,
    taxDebt: 0,
    ownedRentals: {},
    investments: { stocks: 0, bonds: 0, funds: 0 },
    education: 'none',
    lastWorkTimestamp: 0,
    currentStreakDays: 0,
    workSessionEnd: 0,
    studySessionEnd: 0,
    lastUpdate: Date.now()
  };
  localStorage.removeItem('gameState');
  updateDisplays();
}

function hasDayPassed() {
  if (gameState.lastWorkTimestamp === 0) return false;
  const now = Date.now();
  const diffMs = now - gameState.lastWorkTimestamp;
  return diffMs > 24 * 60 * 60 * 1000;
}

function updateStreak() {
  const now = Date.now();
  if (gameState.lastWorkTimestamp === 0) {
    gameState.currentStreakDays = 1;
  } else {
    const diffMs = now - gameState.lastWorkTimestamp;
    const diffDays = diffMs / (24 * 60 * 60 * 1000);

    if (diffDays > 1) {
      gameState.currentStreakDays = 1;
    } else if (diffDays >= 0.9) {
      gameState.currentStreakDays = Math.min(gameState.currentStreakDays + 1, MAX_STREAK_DAYS);
    }
  }
  gameState.lastWorkTimestamp = now;
}

function getCurrentWorkIncome() {
  const streakIncome = BASE_DAILY_INCOME + (gameState.currentStreakDays - 1);
  const cappedStreak = Math.min(streakIncome, MAX_STREAK_INCOME);
  const eduIncome = EDUCATION_INCOME[gameState.education] || 0;
  return Math.max(cappedStreak, eduIncome);
}

function getAssetCount(assetId) {
  return gameState.ownedRentals[assetId] || 0;
}

function buyAsset(assetId) {
  const asset = ASSETS.find(a => a.id === assetId);
  if (!asset || gameState.money < asset.cost) return;
  gameState.money -= asset.cost;
  gameState.ownedRentals[assetId] = (gameState.ownedRentals[assetId] || 0) + 1;
  updateDisplays();
  saveGame();
}

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
      <button class="buy-btn" ${!canAfford ? 'disabled' : ''}>Купить</button>
    `;
    el.querySelector('.buy-btn').addEventListener('click', () => buyAsset(asset.id));
    container.appendChild(el);
  });
}

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

function startWork() {
  if (gameState.workSessionEnd > 0 || gameState.studySessionEnd > 0) {
    alert('Вы уже заняты!');
    return;
  }
  updateStreak();
  gameState.workSessionEnd = Date.now() + WORK_DURATION_SEC * 1000;
  updateDisplays();
  saveGame();
}

function startEducation(level) {
  if (gameState.workSessionEnd > 0 || gameState.studySessionEnd > 0) {
    alert('Вы уже заняты!');
    return;
  }
  if (gameState.education === level) {
    alert('Вы уже получили это образование!');
    return;
  }
  const duration = EDUCATION_DURATION[level];
  if (!duration) return;
  gameState.studySessionEnd = Date.now() + duration * 1000;
  updateDisplays();
  saveGame();
}

function getTotalHourlyIncome() {
  let total = 0;
  ASSETS.forEach(asset => {
    const count = getAssetCount(asset.id);
    total += count * asset.income;
  });
  for (const [key, balance] of Object.entries(gameState.investments)) {
    const annualRate = INVESTMENT_RATES[key] || 0;
    total += balance * annualRate / 365 / 24;
  }
  return total;
}

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

function calculateOfflineIncome() {
  const now = Date.now();
  const elapsedSec = (now - gameState.lastUpdate) / 1000;
  const { income, tax } = calculateIncomeAndTax(elapsedSec);
  gameState.money += income;
  gameState.taxDebt += tax;
  gameState.lastUpdate = now;
}

function enforceTaxPayment() {
  if (gameState.taxDebt <= 0) return;
  if (gameState.money >= gameState.taxDebt) {
    gameState.money -= gameState.taxDebt;
    gameState.taxDebt = 0;
  } else {
    resetGame();
  }
}

// DOM
const moneyDisplay = document.getElementById('money');
const incomePerSecDisplay = document.getElementById('incomePerSec');
const taxDebtDisplay = document.getElementById('taxDebt');
const payTaxBtn = document.getElementById('payTaxBtn');
const rentalsList = document.getElementById('rentals-list');
const resetDevBtn = document.getElementById('resetDevBtn');

const workContent = document.getElementById('work-content');
const rentContent = document.getElementById('rent-content');
const investContent = document.getElementById('invest-content');

const tabWork = document.getElementById('tab-work');
const tabRent = document.getElementById('tab-rent');
const tabInvest = document.getElementById('tab-invest');

const workBtn = document.getElementById('workBtn');
const workStatus = document.getElementById('workStatus');
const streakDisplay = document.getElementById('streakDays');
const incomeDisplay = document.getElementById('workIncome');
const educationDisplay = document.getElementById('educationLevel');

const eduBasicBtn = document.getElementById('eduBasic');
const eduSecondaryBtn = document.getElementById('eduSecondary');
const eduHigherBtn = document.getElementById('eduHigher');

function updateDisplays() {
  moneyDisplay.textContent = `$${formatNumber(gameState.money)}`;
  incomePerSecDisplay.textContent = `$${formatNumber(getTotalHourlyIncome())}`;
  taxDebtDisplay.textContent = `$${formatNumber(gameState.taxDebt)}`;
  payTaxBtn.disabled = gameState.taxDebt <= 0 || gameState.money < gameState.taxDebt;

  renderRentals(rentalsList);

  document.getElementById('stocksBalance').textContent = formatNumber(gameState.investments.stocks);
  document.getElementById('bondsBalance').textContent = formatNumber(gameState.investments.bonds);
  document.getElementById('fundsBalance').textContent = formatNumber(gameState.investments.funds);

  const stocksHourly = gameState.investments.stocks * INVESTMENT_RATES.stocks / 365 / 24;
  const bondsHourly = gameState.investments.bonds * INVESTMENT_RATES.bonds / 365 / 24;
  const fundsHourly = gameState.investments.funds * INVESTMENT_RATES.funds / 365 / 24;

  document.getElementById('stocksIncome').textContent = formatNumber(stocksHourly);
  document.getElementById('bondsIncome').textContent = formatNumber(bondsHourly);
  document.getElementById('fundsIncome').textContent = formatNumber(fundsHourly);

  const now = Date.now();
  let statusText = 'Готов к работе';
  let btnDisabled = false;

  if (gameState.workSessionEnd > now) {
    const remaining = Math.ceil((gameState.workSessionEnd - now) / 1000);
    statusText = `Работаете... Осталось: ${remaining} сек`;
    btnDisabled = true;
  } else if (gameState.workSessionEnd > 0) {
    const income = getCurrentWorkIncome();
    gameState.money += income;
    gameState.workSessionEnd = 0;
    statusText = `Сессия завершена! Получено: $${formatNumber(income)}`;
    saveGame();
  }

  if (gameState.studySessionEnd > now) {
    const remaining = Math.ceil((gameState.studySessionEnd - now) / 1000);
    statusText = `Учитесь... Осталось: ${remaining} сек`;
    btnDisabled = true;
  } else if (gameState.studySessionEnd > 0) {
    if (gameState.education === 'none') gameState.education = 'basic';
    else if (gameState.education === 'basic') gameState.education = 'secondary';
    else if (gameState.education === 'secondary') gameState.education = 'higher';
    gameState.studySessionEnd = 0;
    statusText = `Обучение завершено! Уровень: ${gameState.education}`;
    saveGame();
  }

  workStatus.textContent = statusText;
  workBtn.disabled = btnDisabled;
  streakDisplay.textContent = gameState.currentStreakDays;
  incomeDisplay.textContent = formatNumber(getCurrentWorkIncome());
  educationDisplay.textContent = gameState.education === 'none' ? 'Нет' :
                                 gameState.education === 'basic' ? 'Начальное' :
                                 gameState.education === 'secondary' ? 'Среднее' : 'Высшее';

  eduBasicBtn.disabled = gameState.education !== 'none' || gameState.workSessionEnd > 0 || gameState.studySessionEnd > 0;
  eduSecondaryBtn.disabled = gameState.education !== 'basic' || gameState.workSessionEnd > 0 || gameState.studySessionEnd > 0;
  eduHigherBtn.disabled = gameState.education !== 'secondary' || gameState.workSessionEnd > 0 || gameState.studySessionEnd > 0;
}

function switchTab(tabName) {
  workContent.classList.toggle('active', tabName === 'work');
  rentContent.classList.toggle('active', tabName === 'rent');
  investContent.classList.toggle('active', tabName === 'invest');

  tabWork.classList.toggle('active', tabName === 'work');
  tabRent.classList.toggle('active', tabName === 'rent');
  tabInvest.classList.toggle('active', tabName === 'invest');
}

function payTaxes() {
  if (gameState.taxDebt > 0 && gameState.money >= gameState.taxDebt) {
    gameState.money -= gameState.taxDebt;
    gameState.taxDebt = 0;
    updateDisplays();
    saveGame();
  }
}

loadGame();
calculateOfflineIncome();
updateDisplays();
saveGame();

payTaxBtn.addEventListener('click', payTaxes);
tabWork.addEventListener('click', (e) => { e.preventDefault(); switchTab('work'); });
tabRent.addEventListener('click', (e) => { e.preventDefault(); switchTab('rent'); });
tabInvest.addEventListener('click', (e) => { e.preventDefault(); switchTab('invest'); });
workBtn.addEventListener('click', startWork);
eduBasicBtn?.addEventListener('click', () => startEducation('basic'));
eduSecondaryBtn?.addEventListener('click', () => startEducation('secondary'));
eduHigherBtn?.addEventListener('click', () => startEducation('higher'));
if (resetDevBtn) resetDevBtn.addEventListener('click', resetGame);

setInterval(() => {
  const now = Date.now();
  const elapsedSec = (now - gameState.lastUpdate) / 1000;
  if (elapsedSec >= 1) {
    const { income, tax } = calculateIncomeAndTax(elapsedSec);
    gameState.money += income;
    gameState.taxDebt += tax;
    gameState.lastUpdate = now;
    if (gameState.taxDebt >= TAX_ENFORCEMENT_THRESHOLD) enforceTaxPayment();
    saveGame();
  }
}, 1000);

setInterval(updateDisplays, UI_UPDATE_INTERVAL_MS);