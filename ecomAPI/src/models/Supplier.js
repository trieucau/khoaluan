'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Supplier extends Model {
    static associate(models) {}
  }
  Supplier.init(
    {
      name: DataTypes.STRING,
      address: DataTypes.STRING,
      phonenumber: DataTypes.STRING,
      email: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: 'Supplier',
      tableName: 'suppliers',
    }
  );
  return Supplier;
};
