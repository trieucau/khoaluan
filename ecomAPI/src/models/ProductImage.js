'use strict';

import { Model } from 'sequelize';
export default (sequelize, DataTypes) => {
  class ProductImage extends Model {
    static associate(models) {
      ProductImage.belongsTo(models.ProductDetail, {
        foreignKey: 'productdetailId',
        targetKey: 'id',
        as: 'productImageData',
      });
    }
  }
  ProductImage.init(
    {
      caption: DataTypes.STRING,
      productdetailId: DataTypes.INTEGER,
      image: DataTypes.BLOB('long'),
    },
    {
      sequelize,
      modelName: 'ProductImage',
      tableName: 'productimages',
    }
  );
  return ProductImage;
};
