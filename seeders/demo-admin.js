'use strict';

const bcrypt = require('bcrypt');

const ADMIN_EMAIL = 'admin@test.ru';
const ADMIN_PASSWORD = 'Admin123!';

module.exports = {
  async up(queryInterface) {
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    const now = new Date();

    await queryInterface.bulkInsert('Users', [{
      email: ADMIN_EMAIL,
      passwordHash: passwordHash,
      role: 'admin',
      failedLoginAttempts: 0,
      lockUntil: null,
      createdAt: now,
      updatedAt: now,
    }], {});

    await queryInterface.sequelize.query(
      `SELECT setval(pg_get_serial_sequence('"Users"', 'id'), COALESCE((SELECT MAX(id) FROM "Users"), 1));`
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('Users', { email: ADMIN_EMAIL }, {});
  }
};