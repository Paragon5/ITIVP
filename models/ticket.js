'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Ticket extends Model {
    static associate(models) {
    }
  }

  Ticket.init({
    owner: {
      type: DataTypes.STRING(120),
      allowNull: false
    },
    numbers: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      allowNull: false
    },
    purchaseDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    status: {
      type: DataTypes.ENUM('active', 'winner', 'expired'),
      allowNull: false,
      defaultValue: 'active'
    },
    prizeAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      get() {
        const value = this.getDataValue('prizeAmount');
        return value === null || value === undefined ? 0 : Number(value);
      }
    }
  }, {
    sequelize,
    modelName: 'Ticket',
    tableName: 'Tickets'
  });

  return Ticket;
};
