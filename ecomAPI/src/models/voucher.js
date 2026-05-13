'use strict';
import { Model } from 'sequelize';
export default (sequelize, DataTypes) => {
  class Voucher extends Model {
    static associate(models) {
      Voucher.belongsTo(models.TypeVoucher, {
        foreignKey: 'typeVoucherId',
        targetKey: 'id',
        as: 'typeVoucherOfVoucherData',
      });
      Voucher.hasMany(models.OrderProduct, {
        foreignKey: 'voucherId',
        as: 'voucherData',
      });
    }
  }
  Voucher.init(
    {
      fromDate: DataTypes.STRING,
      toDate: DataTypes.STRING,
      typeVoucherId: DataTypes.INTEGER,
      amount: DataTypes.INTEGER,
      codeVoucher: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: 'Voucher',
      tableName: 'vouchers',
    }
  );
  return Voucher;
};

