require('dotenv').config();
const mongoose = require('../db/mongoose');
const Ticket = require('../models/mongo/Ticket');

// Данные, экспортированные из вашей PostgreSQL (старые билеты через Sequelize)
const postgresTickets = [
  { "prizeAmount": 0, "paymentAmount": 0, "id": 29, "owner": "алекс Гавр", "userId": 9, "numbers": [11, 15, 18, 32, 33, 49], "purchaseDate": "2026-11-17T15:04:05.080Z", "status": "active", "paymentStatus": "pending", "paymentDate": null, "createdAt": "2026-11-17T15:04:05.081Z", "updatedAt": "2026-11-17T15:04:05.081Z" },
  { "prizeAmount": 0, "paymentAmount": 0, "id": 27, "owner": "Александр Гаркович", "userId": 10, "numbers": [14, 18, 26, 37, 39, 47], "purchaseDate": "2026-11-17T14:57:38.697Z", "status": "active", "paymentStatus": "pending", "paymentDate": null, "createdAt": "2026-11-17T14:57:38.698Z", "updatedAt": "2026-11-17T14:57:38.698Z" },
  { "prizeAmount": 0, "paymentAmount": 0, "id": 26, "owner": "неАлександр неГаркович", "userId": 13, "numbers": [15, 17, 37, 40, 42, 48], "purchaseDate": "2026-11-17T14:45:30.122Z", "status": "active", "paymentStatus": "paid", "paymentDate": "2026-11-17T15:25:19.511Z", "createdAt": "2026-11-17T14:45:30.122Z", "updatedAt": "2026-11-17T15:25:19.511Z" },
  { "prizeAmount": 0, "paymentAmount": 0, "id": 17, "owner": "Александр Гаркович", "userId": 10, "numbers": [7, 8, 39, 42, 46, 47], "purchaseDate": "2026-11-03T17:44:46.390Z", "status": "active", "paymentStatus": "pending", "paymentDate": null, "createdAt": "2026-11-03T17:44:46.390Z", "updatedAt": "2026-11-03T17:44:46.390Z" },
  { "prizeAmount": 0, "paymentAmount": 0, "id": 16, "owner": "Александр Гаркович", "userId": 10, "numbers": [6, 9, 37, 41, 42, 49], "purchaseDate": "2026-11-03T17:44:38.853Z", "status": "active", "paymentStatus": "pending", "paymentDate": null, "createdAt": "2026-11-03T17:44:38.853Z", "updatedAt": "2026-11-03T17:44:38.853Z" },
  { "prizeAmount": 100, "paymentAmount": 0, "id": 15, "owner": "тест тест", "userId": 9, "numbers": [7, 14, 21, 28, 35, 42], "purchaseDate": "2026-11-03T17:43:31.588Z", "status": "winner", "paymentStatus": "pending", "paymentDate": null, "createdAt": "2026-11-03T17:43:31.590Z", "updatedAt": "2026-11-17T15:04:29.085Z" },
  { "prizeAmount": 10000, "paymentAmount": 0, "id": 14, "owner": "Тест", "userId": 12, "numbers": [1, 2, 3, 4, 5, 6], "purchaseDate": "2026-11-03T17:40:59.526Z", "status": "winner", "paymentStatus": "pending", "paymentDate": null, "createdAt": "2026-11-03T17:40:59.526Z", "updatedAt": "2026-11-03T17:43:16.603Z" },
  { "prizeAmount": 0, "paymentAmount": 0, "id": 8, "owner": "Александр Гаркович", "userId": null, "numbers": [3, 8, 14, 15, 27, 28], "purchaseDate": "2026-11-03T17:36:15.397Z", "status": "active", "paymentStatus": "pending", "paymentDate": null, "createdAt": "2026-11-03T17:36:15.398Z", "updatedAt": "2026-11-03T17:36:15.398Z" },
  { "prizeAmount": 0, "paymentAmount": 0, "id": 7, "owner": "Александр Гаркович", "userId": null, "numbers": [1, 14, 27, 29, 30, 38], "purchaseDate": "2026-11-03T17:35:30.065Z", "status": "active", "paymentStatus": "pending", "paymentDate": null, "createdAt": "2026-11-03T17:35:30.068Z", "updatedAt": "2026-11-03T17:35:30.068Z" },
  { "prizeAmount": 0, "paymentAmount": 0, "id": 6, "owner": "Дмитрий Соколов", "userId": null, "numbers": [3, 10, 15, 24, 36, 48], "purchaseDate": "2026-09-09T19:00:00.000Z", "status": "active", "paymentStatus": "pending", "paymentDate": null, "createdAt": "2026-11-03T17:33:26.802Z", "updatedAt": "2026-11-03T17:33:26.802Z" },
  { "prizeAmount": 0, "paymentAmount": 0, "id": 4, "owner": "Алексей Смирнов", "userId": null, "numbers": [1, 8, 19, 26, 37, 49], "purchaseDate": "2026-09-05T14:45:00.000Z", "status": "expired", "paymentStatus": "pending", "paymentDate": null, "createdAt": "2026-11-03T17:33:26.802Z", "updatedAt": "2026-11-03T17:33:26.802Z" },
  { "prizeAmount": 0, "paymentAmount": 0, "id": 3, "owner": "Мария Петрова", "userId": null, "numbers": [7, 14, 21, 28, 35, 42], "purchaseDate": "2026-09-03T09:05:00.000Z", "status": "active", "paymentStatus": "pending", "paymentDate": null, "createdAt": "2026-11-03T17:33:26.802Z", "updatedAt": "2026-11-03T17:33:26.802Z" },
  { "prizeAmount": 150000, "paymentAmount": 0, "id": 2, "owner": "Петр Петров", "userId": null, "numbers": [2, 9, 17, 28, 33, 41], "purchaseDate": "2026-09-02T11:30:00.000Z", "status": "winner", "paymentStatus": "pending", "paymentDate": null, "createdAt": "2026-11-03T17:33:26.802Z", "updatedAt": "2026-11-03T17:33:26.802Z" },
  { "prizeAmount": 0, "paymentAmount": 0, "id": 1, "owner": "Иван Иванов", "userId": null, "numbers": [4, 12, 23, 31, 38, 45], "purchaseDate": "2026-09-01T10:15:00.000Z", "status": "active", "paymentStatus": "pending", "paymentDate": null, "createdAt": "2026-11-03T17:33:26.802Z", "updatedAt": "2026-11-03T17:33:26.802Z" }
];

// Преобразование реляционной строки в документную модель MongoDB
const mapped = postgresTickets.map(t => ({
  owner: t.owner,
  userId: t.userId !== null && t.userId !== undefined ? String(t.userId) : undefined,
  numbers: t.numbers,
  purchaseDate: t.purchaseDate ? new Date(t.purchaseDate) : new Date(),
  status: t.status || 'active',
  prizeAmount: Number(t.prizeAmount) || 0,
  tags: [],
  payment: {
    status: t.paymentStatus || 'pending',
    amount: Number(t.paymentAmount) || 0,
    date: t.paymentDate ? new Date(t.paymentDate) : undefined
  },
  reviews: []
}));

async function run() {
  try {
    // Очистим коллекцию, чтобы не было дублей при повторном запуске
    await Ticket.deleteMany({});

    const inserted = await Ticket.insertMany(mapped);
    console.log(`Успешно перенесено билетов в MongoDB Atlas: ${inserted.length}`);
    process.exit(0);
  } catch (err) {
    console.error('Ошибка миграции:', err);
    process.exit(1);
  }
}

run();
