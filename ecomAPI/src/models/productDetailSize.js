'use strict';

import { Model } from 'sequelize';
export default (sequelize, DataTypes) => {
  class ProductDetailSize extends Model {
    static associate(models) {
      ProductDetailSize.belongsTo(models.Allcode, {
        foreignKey: 'sizeId',
        targetKey: 'code',
        as: 'sizeData',
      });
    }
  }
  ProductDetailSize.init(
    {
      productdetailId: DataTypes.INTEGER,
      width: DataTypes.STRING,
      height: DataTypes.STRING,
      weight: DataTypes.STRING,
      sizeId: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: 'ProductDetailSize',
      tableName: 'productdetailsizes',
    }
  );
  return ProductDetailSize;
};
