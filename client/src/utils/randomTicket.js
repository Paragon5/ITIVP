// Пулы для генерации случайного владельца билета
const SURNAMES = [
  'Иванов', 'Петров', 'Сидоров', 'Козлов', 'Новиков',
  'Морозов', 'Волков', 'Зайцев', 'Лебедев', 'Кузнецов',
];
const NAMES = [
  'Иван', 'Пётр', 'Анна', 'Мария', 'Олег',
  'Елена', 'Дмитрий', 'Светлана', 'Алексей', 'Наталья',
];

// Случайный элемент массива
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// 5 уникальных случайных чисел в диапазоне 1–49, по возрастанию
const randomNumbers = () => {
  const set = new Set();
  while (set.size < 5) {
    set.add(Math.floor(Math.random() * 49) + 1);
  }
  return [...set].sort((a, b) => a - b);
};

/**
 * Генерирует лотерейный билет со случайными значениями.
 * Владелец, числа, дата покупки и статус — случайные;
 * сумма приза — единственное «назначаемое» значение.
 *
 * Логика статуса:
 *  - приз > 0  → статус winner (билет выигрышный);
 *  - приз = 0  → случайно active или expired.
 *
 * @param {number} prizeAmount сумма приза в BYN: 0 / 5 / 100 / 10000
 * @returns {object} новый билет
 */
export function generateTicket(prizeAmount) {
  return {
    // id: миллисекунды + случайное число — защита от коллизий
    // при быстрых повторных нажатиях кнопки
    id: Date.now() + Math.floor(Math.random() * 1000),
    owner: `${pick(SURNAMES)} ${pick(NAMES)}`,
    numbers: randomNumbers(),
    purchaseDate: new Date().toISOString(),
    status: prizeAmount > 0 ? 'winner' : (Math.random() < 0.5 ? 'active' : 'expired'),
    prizeAmount,
  };
}
