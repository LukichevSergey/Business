window.Game = window.Game || {};

Game.Tabs = {
  init() {
    document.getElementById('tab-work').addEventListener('click', (e) => {
      e.preventDefault();
      this.switchTab('work');
    });
    document.getElementById('tab-rent').addEventListener('click', (e) => {
      e.preventDefault();
      this.switchTab('rent');
    });
    document.getElementById('tab-invest').addEventListener('click', (e) => {
      e.preventDefault();
      this.switchTab('invest');
    });
    document.getElementById('tab-business').addEventListener('click', (e) => {
      e.preventDefault();
      this.switchTab('business');
    });
  },

  switchTab(name) {
    document.getElementById('work-content').classList.toggle('active', name === 'work');
    document.getElementById('rent-content').classList.toggle('active', name === 'rent');
    document.getElementById('invest-content').classList.toggle('active', name === 'invest');
    document.getElementById('business-content').classList.toggle('active', name === 'business');

    document.getElementById('tab-work').classList.toggle('active', name === 'work');
    document.getElementById('tab-rent').classList.toggle('active', name === 'rent');
    document.getElementById('tab-invest').classList.toggle('active', name === 'invest');
    document.getElementById('tab-business').classList.toggle('active', name === 'business');
  }
};