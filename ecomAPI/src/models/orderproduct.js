'use strict';
import { Model } from 'sequelize';
export default (sequelize, DataTypes) => {
  class OrderProduct extends Model {
    static associate(models) {
      OrderProduct.belongsTo(models.TypeShip, {
        foreignKey: 'typeShipId',
        targetKey: 'id',
        as: 'typeShipData',
      });
      OrderProduct.belongsTo(models.Voucher, {
        foreignKey: 'voucherId',
        targetKey: 'id',
        as: 'voucherData',
      });
      OrderProduct.belongsTo(models.Allcode, {
        foreignKey: 'statusId',
        targetKey: 'code',
        as: 'statusOrderData',
      });
      OrderProduct.hasMany(models.OrderDetail, {
        foreignKey: 'orderId',
        as: 'orderDetail',
      });
    }
  }
  OrderProduct.init(
    {
      addressUserId: DataTypes.INTEGER,
      statusId: DataTypes.STRING,
      typeShipId: DataTypes.INTEGER,
      voucherId: DataTypes.INTEGER,
      note: DataTypes.STRING,
      isPaymentOnlien: DataTypes.INTEGER,
      shipperId: DataTypes.INTEGER,
      image: DataTypes.BLOB('long'),
      statusReason: DataTypes.TEXT,
    },
    {
      sequelize,
      modelName: 'OrderProduct',
      tableName: 'orderproducts',
    }
  );
  return OrderProduct;
};

