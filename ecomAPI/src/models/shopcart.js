'use strict';
import { Model } from 'sequelize';
export default (sequelize, DataTypes) => {
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
