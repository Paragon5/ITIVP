'use strict';

/** @type {import('sequelize-cli').Migration} */
const now = new Date();

const TICKETS = [
  {
    id: 1,
    owner: 'Иван Иванов',
    numbers: [4, 12, 23, 31, 38, 45],
    purchaseDate: new Date('2026-09-01T10:15:00.000Z'),
    status: 'active',
    prizeAmount: 0,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 2,
    owner: 'Петр Петров',
    numbers: [2, 9, 17, 28, 33, 41],
    purchaseDate: new Date('2026-09-02T11:30:00.000Z'),
    status: 'winner',
    prizeAmount: 150000.00,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 3,
    owner: 'Мария Петрова',
    numbers: [7, 14, 21, 28, 35, 42],
    purchaseDate: new Date('2026-09-03T09:05:00.000Z'),
    status: 'active',
    prizeAmount: 0,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 4,
    owner: 'Алексей Смирнов',
    numbers: [1, 8, 19, 26, 37, 49],
    purchaseDate: new Date('2026-09-05T14:45:00.000Z'),
    status: 'expired',
    prizeAmount: 0,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 5,
    owner: 'Ольга Кузнецова',
    numbers: [5, 11, 22, 29, 40, 47],
    purchaseDate: new Date('2026-09-07T16:20:00.000Z'),
    status: 'winner',
    prizeAmount: 25000.50,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 6,
    owner: 'Дмитрий Соколов',
    numbers: [3, 10, 15, 24, 36, 48],
    purchaseDate: new Date('2026-09-09T19:00:00.000Z'),
    status: 'active',
    prizeAmount: 0,
    createdAt: now,
    updatedAt: now,
  },
];

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Tickets', TICKETS, {});

    await queryInterface.sequelize.query(
      `SELECT setval(pg_get_serial_sequence('"Tickets"', 'id'), COALESCE((SELECT MAX(id) FROM "Tickets"), 1));`
    );
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Tickets', { id: TICKETS.map((ticket) => ticket.id) }, {});
  }
};
