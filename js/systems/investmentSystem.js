window.Game = window.Game || {};

Game.InvestmentSystem = {
  invest(type, amount) {
    if (amount <= 0 || isNaN(amount) || Game.State.money < amount) return false;
    Game.State.money -= amount;
    Game.State.investments[type] += amount;
    return true;
  },

  withdraw(type, amount) {
    if (amount <= 0 || isNaN(amount) || Game.State.investments[type] < amount) return false;
    Game.State.investments[type] -= amount;
    Game.State.money += amount;
    return true;
  }
};