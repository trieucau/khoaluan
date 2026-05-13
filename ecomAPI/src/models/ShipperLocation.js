'use strict';
import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class ShipperLocation extends Model {
    static associate(models) {
      ShipperLocation.belongsTo(models.User, {
        foreignKey: 'shipperId',
        targetKey: 'id',
        as: 'shipperData',
      });
    }
  }
  ShipperLocation.init(
    {
      shipperId: DataTypes.INTEGER,
      lat: DataTypes.DECIMAL(10, 8),
      lng: DataTypes.DECIMAL(11, 8),
    },
    {
      sequelize,
      modelName: 'ShipperLocation',
      tableName: 'shipper_locations',
    }
  );
  return ShipperLocation;
};

