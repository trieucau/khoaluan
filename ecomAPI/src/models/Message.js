'use strict';
import { Model } from 'sequelize';
export default (sequelize, DataTypes) => {
  class Message extends Model {
    static associate(models) {}
  }
  Message.init(
    {
      text: DataTypes.TEXT('long'),
      userId: DataTypes.INTEGER,
      roomId: DataTypes.INTEGER,
      unRead: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: 'Message',
      tableName: 'messages',
    }
  );
  return Message;
};
