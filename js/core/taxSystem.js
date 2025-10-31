window.Game = window.Game || {};

Game.TaxSystem = {
  calculateIncomeAndTax(elapsedSec) {
    let totalIncome = 0;
    let totalTax = 0;

    // Аренда
    Game.CONFIG.ASSETS.forEach(asset => {
      const count = Game.State.ownedRentals[asset.id] || 0;
      const incomePerSec = Game.Utils.hourlyToPerSecond(asset.income);
      const income = count * incomePerSec * elapsedSec;
      totalIncome += income;
      totalTax += income * Game.CONFIG.TAX_RATE;
    });

    // Инвестиции: доход = (баланс / 100) * доход_за_100
    for (const [type, balance] of Object.entries(Game.State.investments)) {
      if (balance > 0) {
        const yieldPer100 = Game.CONFIG.INVESTMENT_HOURLY_YIELD[type] || 0;
        const hourlyIncome = (balance / 100) * yieldPer100;
        const incomePerSec = hourlyIncome / 3600;
        const income = incomePerSec * elapsedSec;
        totalIncome += income;
        totalTax += income * Game.CONFIG.TAX_RATE;
      }
    }

    return { income: totalIncome, tax: totalTax };
  },

  getTotalHourlyIncome() {
    let total = 0;

    // Аренда
    Game.CONFIG.ASSETS.forEach(asset => {
      const count = Game.State.ownedRentals[asset.id] || 0;
      total += count * asset.income;
    });

    // Инвестиции
    for (const [type, balance] of Object.entries(Game.State.investments)) {
      const yieldPer100 = Game.CONFIG.INVESTMENT_HOURLY_YIELD[type] || 0;
      total += (balance / 100) * yieldPer100;
    }

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