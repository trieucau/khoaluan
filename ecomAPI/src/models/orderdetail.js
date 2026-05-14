'use strict';
import { Model } from 'sequelize';
export default (sequelize, DataTypes) => {
  class OrderDetail extends Model {
    static associate(models) {
      OrderDetail.belongsTo(models.OrderProduct, {
        foreignKey: 'orderId',
        targetKey: 'id',
        as: 'orderProduct',
      });
    }
  }
  OrderDetail.init(
    {
      orderId: DataTypes.INTEGER,
      productId: DataTypes.INTEGER,
      quantity: DataTypes.INTEGER,
      realPrice: DataTypes.BIGINT,
    },
    {
      sequelize,
      modelName: 'OrderDetail',
      tableName: 'orderdetails',
    }
  );
  return OrderDetail;
};
