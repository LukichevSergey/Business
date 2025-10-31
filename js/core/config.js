window.Game = window.Game || {};

Game.CONFIG = {
  TAX_RATE: 0.1,
  TAX_ENFORCEMENT_THRESHOLD: 100,
  UI_UPDATE_INTERVAL_MS: 1000,
  HOURS_TO_SECONDS: 3600,

  INVESTMENT_RATES: {
    stocks: 0.20,
    bonds: 0.10,
    funds: 0.15
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

  ASSETS: [
    { id: 'studio', name: '1-комн. квартира', cost: 100, income: 10, type: 'rental', isUnique: false },
    { id: 'two_room', name: '2-комн. квартира', cost: 300, income: 30, type: 'rental', isUnique: false },
    { id: 'three_room', name: '3-комн. квартира', cost: 800, income: 80, type: 'rental', isUnique: false },
    { id: 'house1', name: 'Одноэтажный дом', cost: 2500, income: 250, type: 'rental', isUnique: false },
    { id: 'house2', name: 'Двухэтажный дом', cost: 7000, income: 700, type: 'rental', isUnique: false }
  ]
};