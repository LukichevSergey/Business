window.Game = window.Game || {};

Game.CONFIG = {
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