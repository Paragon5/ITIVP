'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Tickets', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      owner: {
        allowNull: false,
        type: Sequelize.STRING(120)
      },
      numbers: {
        allowNull: false,
        type: Sequelize.ARRAY(Sequelize.INTEGER)
      },
      purchaseDate: {
        allowNull: false,
        type: Sequelize.DATE
      },
      status: {
        allowNull: false,
        defaultValue: 'active',
        type: Sequelize.ENUM('active', 'winner', 'expired')
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Tickets');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Tickets_status";');
  }
};