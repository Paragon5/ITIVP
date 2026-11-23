'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Ticket extends Model {
    static associate(models) {
      Ticket.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    }
  }

  Ticket.init({
    owner: {
      type: DataTypes.STRING(120),
      allowNull: false
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'Users', key: 'id' }
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
    },
    paymentStatus: {
      type: DataTypes.ENUM('pending', 'paid', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending'
    },
    paymentAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      get() {
        const value = this.getDataValue('paymentAmount');
        return value === null || value === undefined ? 0 : Number(value);
      }
    },
    paymentDate: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Ticket',
    tableName: 'Tickets'
  });

  return Ticket;
};
