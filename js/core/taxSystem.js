window.Game = window.Game || {};

Game.TaxSystem = {
  /**
   * Рассчитывает общий доход и налог за прошедшее время.
   * @param {number} elapsedSec - прошедшее время в секундах
   * @returns {{ income: number, tax: number }}
   */
  calculateIncomeAndTax(elapsedSec) {
    if (elapsedSec <= 0) return { income: 0, tax: 0 };

    const effects = Game.UpgradeSystem.getEffects();
    const taxRate = effects.taxRate; // может быть 0.1 или 0.08 с улучшением

    let totalIncome = 0;
    let totalTax = 0;

    // === 1. Аренда ===
    Game.CONFIG.ASSETS.forEach(asset => {
      const count = Game.State.ownedRentals[asset.id] || 0;
      if (count > 0) {
        const baseIncomePerSec = Game.Utils.hourlyToPerSecond(asset.income);
        const boostedIncomePerSec = baseIncomePerSec * effects.rentalMultiplier;
        const income = boostedIncomePerSec * elapsedSec;
        totalIncome += income;
        totalTax += income * taxRate;
      }
    });

    // === 2. Инвестиции ===
    for (const [type, balance] of Object.entries(Game.State.investments)) {
      if (balance > 0) {
        const yieldPer100 = Game.CONFIG.INVESTMENT_HOURLY_YIELD[type] || 0;
        const hourlyIncome = (balance / 100) * yieldPer100;
        const boostedHourlyIncome = hourlyIncome * effects.investmentMultiplier;
        const incomePerSec = boostedHourlyIncome / 3600;
        const income = incomePerSec * elapsedSec;
        totalIncome += income;
        totalTax += income * taxRate;
      }
    }

    // === 3. Бизнесы ===
    Game.CONFIG.BUSINESSES.forEach(biz => {
      const level = Game.State.businesses[biz.id] || 0;
      if (level > 0) {
        const incomeHourly = biz.levels[level - 1].income;
        const incomePerSec = incomeHourly / 3600;
        const income = incomePerSec * elapsedSec;
        totalIncome += income;
        totalTax += income * taxRate;
      }
    });

    // === 4. Работа НЕ даёт пассивного дохода — только активные сессии ===
    // (поэтому здесь не учитывается)

    return { income: totalIncome, tax: totalTax };
  },

  getTotalHourlyIncome() {
    const effects = Game.UpgradeSystem.getEffects();
    let total = 0;

    // Аренда
    Game.CONFIG.ASSETS.forEach(asset => {
      const count = Game.State.ownedRentals[asset.id] || 0;
      total += count * asset.income * effects.rentalMultiplier;
    });

    // Инвестиции
    for (const [type, balance] of Object.entries(Game.State.investments)) {
      const yieldPer100 = Game.CONFIG.INVESTMENT_HOURLY_YIELD[type] || 0;
      total += (balance / 100) * yieldPer100 * effects.investmentMultiplier;
    }

    // Бизнесы
    Game.CONFIG.BUSINESSES.forEach(biz => {
      const level = Game.State.businesses[biz.id] || 0;
      if (level > 0) {
        total += biz.levels[level - 1].income;
      }
    });

    return total;
  },

  enforcePayment() {
    if (Game.State.taxDebt <= 0) return true;
    if (Game.State.money >= Game.State.taxDebt) {
      Game.State.money -= Game.State.taxDebt;
      Game.State.taxDebt = 0;
      return true;
    } else {
      return Game.State.reset();
    }
  }
};