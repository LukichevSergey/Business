// Инициализация игры
document.addEventListener('DOMContentLoaded', () => {
  Game.State.load();
  
  // Оффлайн-доход
  const now = Date.now();
  const elapsedSec = (now - Game.State.lastUpdate) / 1000;
  if (elapsedSec > 0) {
    const { income, tax } = Game.TaxSystem.calculateIncomeAndTax(elapsedSec);
    Game.State.money += income;
    Game.State.taxDebt += tax;
    Game.State.lastUpdate = now;
  }

  Game.Tabs.init();
  Game.UI.initEventListeners();
  Game.UI.update();
  Game.State.save();

  // Фоновые расчёты
  setInterval(() => {
    const now = Date.now();
    const elapsedSec = (now - Game.State.lastUpdate) / 1000;
    if (elapsedSec >= 1) {
      const { income, tax } = Game.TaxSystem.calculateIncomeAndTax(elapsedSec);
      Game.State.money += income;
      Game.State.taxDebt += tax;
      Game.State.lastUpdate = now;

      if (Game.State.taxDebt >= Game.CONFIG.TAX_ENFORCEMENT_THRESHOLD) {
        if (!Game.TaxSystem.enforcePayment()) return;
      }

      Game.State.save();
    }
  }, 1000);

  // Обновление UI
  setInterval(() => Game.UI.update(), Game.CONFIG.UI_UPDATE_INTERVAL_MS);
});