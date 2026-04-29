'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class VoucherUsed extends Model {
    static associate(models) {}
  }
  VoucherUsed.init(
    {
      voucherId: DataTypes.INTEGER,
      userId: DataTypes.INTEGER,
      status: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: 'VoucherUsed',
      tableName: 'voucheruseds',
    }
  );
  return VoucherUsed;
};
