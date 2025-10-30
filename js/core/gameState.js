window.Game = window.Game || {};

Game.State = {
  money: 0,
  taxDebt: 0,
  ownedRentals: {},
  investments: { stocks: 0, bonds: 0, funds: 0 },
  education: 'none',
  lastWorkTimestamp: 0,
  currentStreakDays: 0,
  workSessionEnd: 0,
  studySessionEnd: 0,
  lastUpdate: Date.now(),

  save() {
    this.lastUpdate = Date.now();
    localStorage.setItem('gameState', JSON.stringify(this));
  },

  load() {
    const saved = localStorage.getItem('gameState');
    if (saved) {
      const parsed = JSON.parse(saved);
      Object.assign(this, {
        money: parseFloat(parsed.money) || 0,
        taxDebt: parseFloat(parsed.taxDebt) || 0,
        ownedRentals: parsed.ownedRentals || {},
        investments: {
          stocks: parseFloat(parsed.investments?.stocks) || 0,
          bonds: parseFloat(parsed.investments?.bonds) || 0,
          funds: parseFloat(parsed.investments?.funds) || 0
        },
        education: parsed.education || 'none',
        lastWorkTimestamp: Number(parsed.lastWorkTimestamp) || 0,
        currentStreakDays: parseInt(parsed.currentStreakDays) || 0,
        workSessionEnd: Number(parsed.workSessionEnd) || 0,
        studySessionEnd: Number(parsed.studySessionEnd) || 0,
        lastUpdate: Number(parsed.lastUpdate) || Date.now()
      });
    }
  },

  reset() {
    if (!confirm('⚠️ Сбросить игру?')) return false;
    Object.assign(this, {
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
    });
    localStorage.removeItem('gameState');
    return true;
  }
};