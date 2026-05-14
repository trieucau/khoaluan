'use strict';
import { Model } from 'sequelize';
export default (sequelize, DataTypes) => {
  class AddressUser extends Model {
    static associate(models) {}
  }
  AddressUser.init(
    {
      userId: DataTypes.INTEGER,
      shipName: DataTypes.STRING,
      shipAdress: DataTypes.STRING,
      shipEmail: DataTypes.STRING,
      shipPhonenumber: DataTypes.STRING,
      lat: DataTypes.DECIMAL(10, 8),
      lng: DataTypes.DECIMAL(11, 8),
    },
    {
      sequelize,
      modelName: 'AddressUser',
      tableName: 'addressusers',
    }
  );
  return AddressUser;
};
