/**
 * Начальные (моковые) данные — лотерейные билеты.
 * Структура повторяет модель Ticket из серверной части курсового проекта
 * (owner, numbers, purchaseDate, status, prizeAmount).
 * Суммы призов — в белорусских рублях (BYN, Br).
 */
export const INITIAL_TICKETS = [
  {
    id: 1,
    owner: 'Иванов Иван',
    numbers: [3, 14, 22, 35, 41],
    purchaseDate: '2026-09-01T10:15:00',
    status: 'active',
    prizeAmount: 0,
  },
  {
    id: 2,
    owner: 'Петрова Анна',
    numbers: [5, 9, 18, 27, 33],
    purchaseDate: '2026-09-05T14:30:00',
    status: 'winner',
    prizeAmount: 100, // средний приз, Br
  },
  {
    id: 3,
    owner: 'Сидоров Пётр',
    numbers: [1, 7, 12, 24, 48],
    purchaseDate: '2026-08-20T09:00:00',
    status: 'expired',
    prizeAmount: 0,
  },
];

// Ключ хранения списка в localStorage
export const TICKETS_STORAGE_KEY = 'lab4_tickets';

// Категории призов при создании билета (суммы в BYN)
export const PRIZE_TIERS = [
  { value: 0, label: 'Нет приза' },
  { value: 5, label: 'Мин приз — 5 Br' },
  { value: 100, label: 'Средний приз — 100 Br' },
  { value: 10000, label: 'Макс приз — 10 000 Br' },
];

