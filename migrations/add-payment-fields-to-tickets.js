'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Tickets', 'paymentStatus', {
      type: Sequelize.ENUM('pending', 'paid', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
    });

    await queryInterface.addColumn('Tickets', 'paymentAmount', {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    });

    await queryInterface.addColumn('Tickets', 'paymentDate', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Tickets', 'paymentStatus');
    await queryInterface.removeColumn('Tickets', 'paymentAmount');
    await queryInterface.removeColumn('Tickets', 'paymentDate');
  },
};
