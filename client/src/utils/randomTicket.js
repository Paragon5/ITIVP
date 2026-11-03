import { evaluateTicket } from './prize.js';

const SURNAMES = [
  'Иванов', 'Петров', 'Сидоров', 'Козлов', 'Новиков',
  'Морозов', 'Волков', 'Зайцев', 'Лебедев', 'Кузнецов',
];
const NAMES = [
  'Иван', 'Пётр', 'Анна', 'Мария', 'Олег',
  'Елена', 'Дмитрий', 'Светлана', 'Алексей', 'Наталья',
];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const randomNumbers = () => {
  const set = new Set();
  while (set.size < 6) {
    set.add(Math.floor(Math.random() * 49) + 1);
  }
  return [...set].sort((a, b) => a - b);
};

export function generateTicket() {
  const numbers = randomNumbers();
  const purchaseDate = new Date().toISOString();
  const evaluated = evaluateTicket(numbers, purchaseDate);
  return {
    id: Date.now() + Math.floor(Math.random() * 1000),
    owner: `${pick(SURNAMES)} ${pick(NAMES)}`,
    numbers,
    purchaseDate,
    status: evaluated.status,
    prizeAmount: evaluated.prizeAmount,
  };
}
