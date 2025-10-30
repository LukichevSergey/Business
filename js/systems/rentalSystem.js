window.Game = window.Game || {};

Game.RentalSystem = {
  buyAsset(assetId) {
    const asset = Game.CONFIG.ASSETS.find(a => a.id === assetId);
    if (!asset || Game.State.money < asset.cost) return false;
    Game.State.money -= asset.cost;
    Game.State.ownedRentals[assetId] = (Game.State.ownedRentals[assetId] || 0) + 1;
    return true;
  },

  getAssetCount(assetId) {
    return Game.State.ownedRentals[assetId] || 0;
  },

  render(container) {
    container.innerHTML = '';
    Game.CONFIG.ASSETS.forEach(asset => {
      const count = this.getAssetCount(asset.id);
      const totalHourly = count * asset.income;
      const canAfford = Game.State.money >= asset.cost;
      const el = document.createElement('div');
      el.className = 'asset-item';
      el.innerHTML = `
        <div class="asset-info">
          <h3>${asset.name}</h3>
          <p>Стоимость: $${Game.Utils.formatNumber(asset.cost)}</p>
          <p>Доход: $${Game.Utils.formatNumber(asset.income)}/час за шт.</p>
          <p>Куплено: ${count} шт. → Общий доход: $${Game.Utils.formatNumber(totalHourly)}/час</p>
        </div>
        <button class="buy-btn" ${!canAfford ? 'disabled' : ''}>Купить</button>
      `;
      el.querySelector('.buy-btn').addEventListener('click', () => {
        if (this.buyAsset(asset.id)) {
          Game.UI.update();
          Game.State.save();
        }
      });
      container.appendChild(el);
    });
  }
};