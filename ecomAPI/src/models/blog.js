'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Blog extends Model {
    static associate(models) {
      Blog.belongsTo(models.Allcode, {
        foreignKey: 'subjectId',
        targetKey: 'code',
        as: 'subjectData',
      });
    }
  }
  Blog.init(
    {
      shortdescription: DataTypes.TEXT('long'),
      title: DataTypes.STRING,
      subjectId: DataTypes.STRING,
      statusId: DataTypes.STRING,
      image: DataTypes.BLOB('long'),
      contentMarkdown: DataTypes.TEXT('long'),
      contentHTML: DataTypes.TEXT('long'),
      userId: DataTypes.INTEGER,
      view: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: 'Blog',
      tableName: 'blogs',
    }
  );
  return Blog;
};
