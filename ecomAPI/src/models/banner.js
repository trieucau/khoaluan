'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Banner extends Model {
    static associate(models) {}
  }
  Banner.init(
    {
      description: DataTypes.STRING,
      name: DataTypes.STRING,
      statusId: DataTypes.STRING,
      image: DataTypes.BLOB('long'),
    },
    {
      sequelize,
      modelName: 'Banner',
      tableName: 'banners',
    }
  );
  return Banner;
};
