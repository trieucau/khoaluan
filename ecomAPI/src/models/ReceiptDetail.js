'use strict';
import { Model } from 'sequelize';
export default (sequelize, DataTypes) => {
  class ReceiptDetail extends Model {
    static associate(models) {}
  }
  ReceiptDetail.init(
    {
      receiptId: DataTypes.INTEGER,
      productDetailSizeId: DataTypes.INTEGER,
      quantity: DataTypes.INTEGER,
      price: DataTypes.BIGINT,
    },
    {
      sequelize,
      modelName: 'ReceiptDetail',
      tableName: 'receiptdetails',
    }
  );
  return ReceiptDetail;
};

