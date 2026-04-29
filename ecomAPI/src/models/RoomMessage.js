'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class RoomMessage extends Model {
    static associate(models) {}
  }
  RoomMessage.init(
    {
      userOne: DataTypes.INTEGER,
      userTwo: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: 'RoomMessage',
      tableName: 'roommessages',
    }
  );
  return RoomMessage;
};
