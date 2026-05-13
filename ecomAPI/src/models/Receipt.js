'use strict';
import { Model } from 'sequelize';
export default (sequelize, DataTypes) => {
  class Receipt extends Model {
    static associate(models) {}
  }
  Receipt.init(
    {
      userId: DataTypes.INTEGER,
      supplierId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: 'Receipt',
      tableName: 'receipts',
    }
  );
  return Receipt;
};

