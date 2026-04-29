'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ShopCart extends Model {
    static associate(models) {}
  }
  ShopCart.init(
    {
      userId: DataTypes.INTEGER,
      productdetailsizeId: DataTypes.INTEGER,
      quantity: DataTypes.INTEGER,
      statusId: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: 'ShopCart',
      tableName: 'shopcarts',
    }
  );
  return ShopCart;
};
