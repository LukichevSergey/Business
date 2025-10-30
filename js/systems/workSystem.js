window.Game = window.Game || {};

Game.WorkSystem = {
  updateStreak() {
    const now = Date.now();
    if (Game.State.lastWorkTimestamp === 0) {
      Game.State.currentStreakDays = 1;
    } else {
      const diffDays = (now - Game.State.lastWorkTimestamp) / (24 * 60 * 60 * 1000);
      if (diffDays > 1) {
        Game.State.currentStreakDays = 1;
      } else if (diffDays >= 0.9) {
        Game.State.currentStreakDays = Math.min(Game.State.currentStreakDays + 1, Game.CONFIG.MAX_STREAK_DAYS);
      }
    }
    Game.State.lastWorkTimestamp = now;
  },

  getCurrentIncome() {
    const streakIncome = Game.CONFIG.BASE_DAILY_INCOME + (Game.State.currentStreakDays - 1);
    const capped = Math.min(streakIncome, Game.CONFIG.MAX_STREAK_INCOME);
    const edu = Game.CONFIG.EDUCATION_INCOME[Game.State.education] || 0;
    return Math.max(capped, edu);
  },

  startWork() {
    if (Game.State.workSessionEnd > 0 || Game.State.studySessionEnd > 0) return false;
    this.updateStreak();
    Game.State.workSessionEnd = Date.now() + Game.CONFIG.WORK_DURATION_SEC * 1000;
    return true;
  },

  startEducation(level) {
    if (Game.State.workSessionEnd > 0 || Game.State.studySessionEnd > 0) return false;
    if (Game.State.education === level) return false;
    const duration = Game.CONFIG.EDUCATION_DURATION[level];
    if (!duration) return false;
    Game.State.studySessionEnd = Date.now() + duration * 1000;
    return true;
  },

  completeWork() {
    const income = this.getCurrentIncome();
    Game.State.money += income;
    Game.State.workSessionEnd = 0;
    return income;
  },

  completeEducation() {
    if (Game.State.education === 'none') Game.State.education = 'basic';
    else if (Game.State.education === 'basic') Game.State.education = 'secondary';
    else if (Game.State.education === 'secondary') Game.State.education = 'higher';
    Game.State.studySessionEnd = 0;
  }
};