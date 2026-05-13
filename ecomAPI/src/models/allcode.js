'use strict';
import { Model } from 'sequelize';
export default (sequelize, DataTypes) => {
  class Allcode extends Model {
    static associate(models) {
      Allcode.hasMany(models.User, {
        foreignKey: 'genderId',
        as: 'genderData',
      });
      Allcode.hasMany(models.User, { foreignKey: 'roleId', as: 'roleData' });
      Allcode.hasMany(models.Product, {
        foreignKey: 'categoryId',
        as: 'categoryData',
      });
      Allcode.hasMany(models.Product, {
        foreignKey: 'brandId',
        as: 'brandData',
      });
      Allcode.hasMany(models.Product, {
        foreignKey: 'statusId',
        as: 'statusData',
      });
      Allcode.hasMany(models.Blog, {
        foreignKey: 'subjectId',
        as: 'subjectData',
      });
      Allcode.hasMany(models.TypeVoucher, {
        foreignKey: 'typeVoucher',
        as: 'typeVoucherData',
      });
      Allcode.hasMany(models.ProductDetailSize, {
        foreignKey: 'sizeId',
        as: 'sizeData',
      });
      Allcode.hasMany(models.OrderProduct, {
        foreignKey: 'statusId',
        as: 'statusOrderData',
      });
    }
  }
  Allcode.init(
    {
      type: DataTypes.STRING,
      value: DataTypes.STRING,
      code: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: 'Allcode',
      tableName: 'allcodes',
    }
  );
  return Allcode;
};

