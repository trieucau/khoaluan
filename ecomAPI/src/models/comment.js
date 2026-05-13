'use strict';
import { Model } from 'sequelize';
export default (sequelize, DataTypes) => {
  class Comment extends Model {
    static associate(models) {}
  }
  Comment.init(
    {
      content: DataTypes.TEXT('long'),
      parentId: DataTypes.INTEGER,
      productId: DataTypes.INTEGER,
      userId: DataTypes.INTEGER,
      blogId: DataTypes.INTEGER,
      star: DataTypes.INTEGER,
      image: DataTypes.BLOB('long'),
    },
    {
      sequelize,
      modelName: 'Comment',
      tableName: 'comments',
    }
  );
  return Comment;
};

