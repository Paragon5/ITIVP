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
  while (set.size < 5) {
    set.add(Math.floor(Math.random() * 49) + 1);
  }
  return [...set].sort((a, b) => a - b);
};


export function generateTicket(prizeAmount) {
  return {
    id: Date.now() + Math.floor(Math.random() * 1000),
    owner: `${pick(SURNAMES)} ${pick(NAMES)}`,
    numbers: randomNumbers(),
    purchaseDate: new Date().toISOString(),
    status: prizeAmount > 0 ? 'winner' : (Math.random() < 0.5 ? 'active' : 'expired'),
    prizeAmount,
  };
}
