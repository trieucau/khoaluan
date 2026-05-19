'use strict';
import { Model } from 'sequelize';
export default (sequelize, DataTypes) => {
  class Banner extends Model {
    static associate(models) {}
  }
  Banner.init(
    {
      description: DataTypes.STRING,
      name: DataTypes.STRING,
      statusId: DataTypes.STRING,
      image: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: 'Banner',
      tableName: 'banners',
    }
  );
  return Banner;
};
