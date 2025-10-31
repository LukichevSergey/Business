window.Game = window.Game || {};

Game.BusinessSystem = {
  // Получить текущий уровень бизнеса (0 = не куплен, 1/2/3 = уровень)
  getLevel(businessId) {
    return Game.State.businesses[businessId] || 0;
  },

  // Получить текущий доход
  getIncome(businessId) {
    const level = this.getLevel(businessId);
    if (level === 0) return 0;
    const business = Game.CONFIG.BUSINESSES.find(b => b.id === businessId);
    return business.levels[level - 1].income;
  },

  // Можно ли улучшить?
  canUpgrade(businessId) {
    const level = this.getLevel(businessId);
    const business = Game.CONFIG.BUSINESSES.find(b => b.id === businessId);
    return level > 0 && level < business.levels.length;
  },

  // Можно ли купить (первый уровень)?
  canBuy(businessId) {
    return this.getLevel(businessId) === 0;
  },

  // Покупка или улучшение
  upgrade(businessId) {
    const currentLevel = this.getLevel(businessId);
    const business = Game.CONFIG.BUSINESSES.find(b => b.id === businessId);
    if (!business) return false;

    const nextLevel = currentLevel + 1;
    if (nextLevel > business.levels.length) return false;

    const cost = business.levels[nextLevel - 1].cost;
    if (Game.State.money < cost) return false;

    Game.State.money -= cost;
    Game.State.businesses[businessId] = nextLevel;
    return true;
  },

  // Рендер вкладки
  render(container) {
    container.innerHTML = '<h3>Развивайте свой бизнес!</h3>';

    Game.CONFIG.BUSINESSES.forEach(biz => {
      const level = this.getLevel(biz.id);
      const current = level > 0 ? biz.levels[level - 1] : null;
      const nextLevel = level < biz.levels.length ? biz.levels[level] : null;

      const el = document.createElement('div');
      el.className = 'business-item';

      let content = `<h3>${biz.name}</h3>`;

      if (level === 0) {
        content += `<p>Не запущен</p>`;
        content += `<p>Старт: ${biz.levels[0].name} — $${Game.Utils.formatNumber(biz.levels[0].cost)}</p>`;
        content += `<button class="buy-btn" data-id="${biz.id}">Запустить</button>`;
      } else {
        content += `<p>Текущий уровень: ${current.name}</p>`;
        content += `<p>Доход: $${Game.Utils.formatNumber(current.income)}/час</p>`;
        if (nextLevel) {
          content += `<p>Улучшение: ${nextLevel.name} — $${Game.Utils.formatNumber(nextLevel.cost)}</p>`;
          content += `<button class="upgrade-btn" data-id="${biz.id}">Улучшить</button>`;
        } else {
          content += `<p style="color:green;">Макс. уровень достигнут</p>`;
        }
      }

      el.innerHTML = content;
      container.appendChild(el);

      // Обработчики
      const buyBtn = el.querySelector('.buy-btn');
      if (buyBtn) {
        buyBtn.addEventListener('click', () => {
          if (this.upgrade(biz.id)) {
            Game.UI.update();
            Game.State.save();
          } else {
            alert('Недостаточно средств!');
          }
        });
      }

      const upgradeBtn = el.querySelector('.upgrade-btn');
      if (upgradeBtn) {
        upgradeBtn.addEventListener('click', () => {
          if (this.upgrade(biz.id)) {
            Game.UI.update();
            Game.State.save();
          } else {
            alert('Недостаточно средств!');
          }
        });
      }
    });
  }
};