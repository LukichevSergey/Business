window.Game = window.Game || {};

Game.CONFIG = {

    /** @constant {number} Глобальный множитель скорости игры (1 = нормально, 5 = ускорено в 5 раз) */
  GAME_SPEED_MULTIPLIER: 1,

  TAX_RATE: 0.1,
  TAX_ENFORCEMENT_THRESHOLD: 100,
  UI_UPDATE_INTERVAL_MS: 3000,
  HOURS_TO_SECONDS: 3600,

  INVESTMENT_HOURLY_YIELD: {
    stocks: 5,    // $5/час за $100
    funds: 3.5,   // $3.5/час за $100
    bonds: 2      // $2/час за $100
  },

  BASE_DAILY_INCOME: 10,
  MAX_STREAK_INCOME: 20,
  MAX_STREAK_DAYS: 10,
  WORK_DURATION_SEC: 60,

  EDUCATION_INCOME: {
    none: 0,
    basic: 20,
    secondary: 30,
    higher: 50
  },

  EDUCATION_DURATION: {
    basic: 120,
    secondary: 300,
    higher: 600
  },

  UPGRADES: [
    {
      id: 'accountant',
      name: '📚 Бухгалтер',
      description: 'Налоги снижены с 10% до 8%',
      cost: 1000,
      condition: () => Game.State.money >= 500,
      effect: () => ({ taxRate: 0.08 })
    },
    {
      id: 'property_manager',
      name: '🏗️ Управляющая компания',
      description: '+15% к доходу от аренды',
      cost: 3000,
      condition: () => Object.values(Game.State.ownedRentals).reduce((a, b) => a + b, 0) >= 3,
      effect: () => ({ rentalMultiplier: 1.15 })
    },
    {
      id: 'financial_advisor',
      name: '📊 Финансовый советник',
      description: '+10% к доходу от инвестиций',
      cost: 5000,
      condition: () => (Game.State.investments.stocks + Game.State.investments.bonds + Game.State.investments.funds) >= 1000,
      effect: () => ({ investmentMultiplier: 1.10 })
    },
    {
      id: 'business_incubator',
      name: '🚀 Бизнес-инкубатор',
      description: '–20% к стоимости улучшения бизнеса',
      cost: 10000,
      condition: () => Object.values(Game.State.businesses).some(level => level >= 2),
      effect: () => ({ businessDiscount: 0.8 })
    },
    {
      id: 'mba',
      name: '🎓 MBA',
      description: 'Макс. стаж работы — 11 дней (+1)',
      cost: 20000,
      condition: () => Game.State.education === 'higher',
      effect: () => ({ maxStreakDays: 11 })
    }
  ],

  // Аренда: более дорогие объекты — эффективнее
  ASSETS: [
    { id: 'studio',     name: '1-комн. квартира',   cost: 100,    income: 1.5 },
    { id: 'two_room',   name: '2-комн. квартира',   cost: 300,    income: 5 },
    { id: 'three_room', name: '3-комн. квартира',   cost: 800,    income: 15 },
    { id: 'house1',     name: 'Одноэтажный дом',    cost: 2500,   income: 50 },
    { id: 'house2',     name: 'Двухэтажный дом',    cost: 7000,   income: 150 }
  ],

  BUSINESSES: [
    {
      id: 'cafe',
      name: 'Кафе',
      levels: [
        { cost: 500,    income: 20,   name: 'Кофейня' },
        { cost: 5000,   income: 250,  name: 'Сеть кофеен' },
        { cost: 50000,  income: 3000, name: 'Кофейный бренд' }
      ]
    },
    {
      id: 'retail',
      name: 'Ритейл',
      levels: [
        { cost: 300,    income: 15,   name: 'Ларёк' },
        { cost: 3000,   income: 200,  name: 'Продуктовый магазин' },
        { cost: 30000,  income: 2500, name: 'Супермаркет' }
      ]
    },
    {
      id: 'tech',
      name: 'Технологии',
      levels: [
        { cost: 1000,   income: 50,   name: 'Стартап' },
        { cost: 10000,  income: 600,  name: 'IT-компания' },
        { cost: 100000, income: 8000, name: 'Корпорация' }
      ]
    }
  ]
};