window.Game = window.Game || {};

Game.UpgradeSystem = {
  isUnlocked(upgradeId) {
    const upgrade = Game.CONFIG.UPGRADES.find(u => u.id === upgradeId);
    return upgrade ? upgrade.condition() : false;
  },

  isPurchased(upgradeId) {
    return Game.State.upgrades[upgradeId] === true;
  },

  purchase(upgradeId) {
    const upgrade = Game.CONFIG.UPGRADES.find(u => u.id === upgradeId);
    if (!upgrade || this.isPurchased(upgradeId) || !this.isUnlocked(upgradeId)) return false;
    if (Game.State.money < upgrade.cost) return false;

    Game.State.money -= upgrade.cost;
    Game.State.upgrades[upgradeId] = true;
    return true;
  },

  // Применить все эффекты
  getEffects() {
    const effects = {
      taxRate: Game.CONFIG.TAX_RATE,
      rentalMultiplier: 1,
      investmentMultiplier: 1,
      businessDiscount: 1,
      maxStreakDays: Game.CONFIG.MAX_STREAK_DAYS
    };

    Game.CONFIG.UPGRADES.forEach(upg => {
      if (Game.State.upgrades[upg.id]) {
        const eff = upg.effect();
        Object.assign(effects, eff);
      }
    });

    return effects;
  },

  render(container) {
    container.innerHTML = '<h3>Глобальные улучшения</h3><p>Покупайте бонусы для всей игры!</p>';

    Game.CONFIG.UPGRADES.forEach(upg => {
      const purchased = this.isPurchased(upg.id);
      const unlocked = this.isUnlocked(upg.id);
      const canAfford = Game.State.money >= upg.cost;

      const el = document.createElement('div');
      el.className = 'upgrade-item';
      el.innerHTML = `
        <h3>${upg.name}</h3>
        <p>${upg.description}</p>
        <p>Стоимость: $${Game.Utils.formatNumber(upg.cost)}</p>
        ${purchased 
          ? '<p style="color:green;">✅ Куплено</p>' 
          : `<button class="buy-upgrade-btn" data-id="${upg.id}" ${(!unlocked || !canAfford) ? 'disabled' : ''}>
              ${unlocked ? 'Купить' : 'Заблокировано'}
            </button>`
        }
      `;
      container.appendChild(el);

      if (!purchased && unlocked) {
        const btn = el.querySelector('.buy-upgrade-btn');
        btn.addEventListener('click', () => {
          if (this.purchase(upg.id)) {
            Game.UI.update();
            Game.State.save();
          }
        });
      }
    });
  }
};