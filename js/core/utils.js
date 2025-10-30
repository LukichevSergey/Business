window.Game = window.Game || {};

Game.Utils = {
  formatNumber(num) {
    return num.toLocaleString('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  },

  hourlyToPerSecond(hourly) {
    return hourly / Game.CONFIG.HOURS_TO_SECONDS;
  },

  hasDayPassed(lastTimestamp) {
    if (lastTimestamp === 0) return false;
    const now = Date.now();
    return (now - lastTimestamp) > 24 * 60 * 60 * 1000;
  }
};