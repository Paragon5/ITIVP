'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Message extends Model {}
  Message.init({
    room: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'general'
    },
    text: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    user: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Аноним'
    }
  }, {
    sequelize,
    modelName: 'Message',
    tableName: 'Messages',
    timestamps: true
  });

  return Message;
};
