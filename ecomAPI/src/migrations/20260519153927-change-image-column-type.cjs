'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableNames = ['users', 'productimages', 'orderproducts', 'comments', 'blogs', 'banners'];
    for (let table of tableNames) {
      await queryInterface.changeColumn(table, 'image', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const tableNames = ['users', 'productimages', 'orderproducts', 'comments', 'blogs', 'banners'];
    for (let table of tableNames) {
      await queryInterface.changeColumn(table, 'image', {
        type: Sequelize.BLOB('long'),
        allowNull: true,
      });
    }
  },
};
