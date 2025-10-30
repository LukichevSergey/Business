window.Game = window.Game || {};

Game.UI = {
  update() {
    const state = Game.State;
    const now = Date.now();

    // Баланс и доход
    document.getElementById('money').textContent = `$${Game.Utils.formatNumber(state.money)}`;
    document.getElementById('incomePerSec').textContent = `$${Game.Utils.formatNumber(Game.TaxSystem.getTotalHourlyIncome())}`;
    document.getElementById('taxDebt').textContent = `$${Game.Utils.formatNumber(state.taxDebt)}`;
    document.getElementById('payTaxBtn').disabled = state.taxDebt <= 0 || state.money < state.taxDebt;

    // Аренда
    Game.RentalSystem.render(document.getElementById('rentals-list'));

    // Инвестиции
    const inv = state.investments;
    document.getElementById('stocksBalance').textContent = Game.Utils.formatNumber(inv.stocks);
    document.getElementById('bondsBalance').textContent = Game.Utils.formatNumber(inv.bonds);
    document.getElementById('fundsBalance').textContent = Game.Utils.formatNumber(inv.funds);

    const rates = Game.CONFIG.INVESTMENT_RATES;
    document.getElementById('stocksIncome').textContent = Game.Utils.formatNumber(inv.stocks * rates.stocks / 365 / 24);
    document.getElementById('bondsIncome').textContent = Game.Utils.formatNumber(inv.bonds * rates.bonds / 365 / 24);
    document.getElementById('fundsIncome').textContent = Game.Utils.formatNumber(inv.funds * rates.funds / 365 / 24);

    // Работа
    let status = 'Готов к работе';
    let workBtnDisabled = false;

    if (state.workSessionEnd > now) {
      const rem = Math.ceil((state.workSessionEnd - now) / 1000);
      status = `Работаете... Осталось: ${rem} сек`;
      workBtnDisabled = true;
    } else if (state.workSessionEnd > 0) {
      const income = Game.WorkSystem.completeWork();
      status = `Сессия завершена! Получено: $${Game.Utils.formatNumber(income)}`;
      Game.State.save();
    }

    if (state.studySessionEnd > now) {
      const rem = Math.ceil((state.studySessionEnd - now) / 1000);
      status = `Учитесь... Осталось: ${rem} сек`;
      workBtnDisabled = true;
    } else if (state.studySessionEnd > 0) {
      Game.WorkSystem.completeEducation();
      status = `Обучение завершено! Уровень: ${state.education}`;
      Game.State.save();
    }

    document.getElementById('workStatus').textContent = status;
    document.getElementById('workBtn').disabled = workBtnDisabled;
    document.getElementById('streakDays').textContent = state.currentStreakDays;
    document.getElementById('workIncome').textContent = Game.Utils.formatNumber(Game.WorkSystem.getCurrentIncome());
    document.getElementById('educationLevel').textContent = 
      state.education === 'none' ? 'Нет' :
      state.education === 'basic' ? 'Начальное' :
      state.education === 'secondary' ? 'Среднее' : 'Высшее';

    // Кнопки образования
    document.getElementById('eduBasic').disabled = state.education !== 'none' || state.workSessionEnd > 0 || state.studySessionEnd > 0;
    document.getElementById('eduSecondary').disabled = state.education !== 'basic' || state.workSessionEnd > 0 || state.studySessionEnd > 0;
    document.getElementById('eduHigher').disabled = state.education !== 'secondary' || state.workSessionEnd > 0 || state.studySessionEnd > 0;
  },

  initEventListeners() {
    document.getElementById('workBtn').addEventListener('click', () => {
      if (Game.WorkSystem.startWork()) {
        this.update();
        Game.State.save();
      } else {
        alert('Вы уже заняты!');
      }
    });

    const eduBtns = [
      { id: 'eduBasic', level: 'basic' },
      { id: 'eduSecondary', level: 'secondary' },
      { id: 'eduHigher', level: 'higher' }
    ];
    eduBtns.forEach(btn => {
      document.getElementById(btn.id).addEventListener('click', () => {
        if (Game.WorkSystem.startEducation(btn.level)) {
          this.update();
          Game.State.save();
        } else {
          alert('Невозможно начать обучение!');
        }
      });
    });

    document.getElementById('payTaxBtn').addEventListener('click', () => {
      if (Game.State.taxDebt > 0 && Game.State.money >= Game.State.taxDebt) {
        Game.State.money -= Game.State.taxDebt;
        Game.State.taxDebt = 0;
        this.update();
        Game.State.save();
      }
    });

    document.getElementById('resetDevBtn').addEventListener('click', () => {
      if (Game.State.reset()) this.update();
    });

    // Инвестиции
    const investActions = [
      { btn: 'stocksInvest', type: 'stocks', action: 'invest' },
      { btn: 'stocksWithdraw', type: 'stocks', action: 'withdraw' },
      { btn: 'bondsInvest', type: 'bonds', action: 'invest' },
      { btn: 'bondsWithdraw', type: 'bonds', action: 'withdraw' },
      { btn: 'fundsInvest', type: 'funds', action: 'invest' },
      { btn: 'fundsWithdraw', type: 'funds', action: 'withdraw' }
    ];

    investActions.forEach(({ btn, type, action }) => {
      document.getElementById(btn).addEventListener('click', () => {
        const input = document.getElementById(type + 'Input');
        const amount = parseFloat(input.value);
        if (isNaN(amount) || amount <= 0) return;
        const success = action === 'invest' 
          ? Game.InvestmentSystem.invest(type, amount)
          : Game.InvestmentSystem.withdraw(type, amount);
        if (success) {
          this.update();
          Game.State.save();
          input.value = '';
        }
      });
    });
  }
};