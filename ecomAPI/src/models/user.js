'use strict';
import { Model } from 'sequelize';
export default (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.belongsTo(models.Allcode, {
        foreignKey: 'genderId',
        targetKey: 'code',
        as: 'genderData',
      });
      User.belongsTo(models.Allcode, {
        foreignKey: 'roleId',
        targetKey: 'code',
        as: 'roleData',
      });
    }
  }
  User.init(
    {
      email: DataTypes.STRING,
      password: DataTypes.STRING,
      firstName: DataTypes.STRING,
      lastName: DataTypes.STRING,
      address: DataTypes.STRING,
      genderId: DataTypes.STRING,
      phonenumber: DataTypes.STRING,
      image: DataTypes.STRING,
      dob: DataTypes.STRING,
      isActiveEmail: DataTypes.BOOLEAN,
      roleId: DataTypes.STRING,
      statusId: DataTypes.STRING,
      usertoken: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
    }
  );
  return User;
};
