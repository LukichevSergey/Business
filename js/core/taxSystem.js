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

    // Инвестиции
    for (const [key, balance] of Object.entries(Game.State.investments)) {
      if (balance > 0) {
        const annualRate = Game.CONFIG.INVESTMENT_RATES[key] || 0;
        const incomePerSec = balance * annualRate / (365 * 24 * 3600);
        const income = incomePerSec * elapsedSec;
        totalIncome += income;
        totalTax += income * Game.CONFIG.TAX_RATE;
      }
    }

    return { income: totalIncome, tax: totalTax };
  },

  getTotalHourlyIncome() {
    let total = 0;
    Game.CONFIG.ASSETS.forEach(asset => {
      const count = Game.State.ownedRentals[asset.id] || 0;
      total += count * asset.income;
    });
    for (const [key, balance] of Object.entries(Game.State.investments)) {
      const annualRate = Game.CONFIG.INVESTMENT_RATES[key] || 0;
      total += balance * annualRate / 365 / 24;
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