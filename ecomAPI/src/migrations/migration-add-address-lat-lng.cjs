'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('AddressUsers', 'lat', {
      type: Sequelize.DECIMAL(10, 8),
      allowNull: true,
    });
    await queryInterface.addColumn('AddressUsers', 'lng', {
      type: Sequelize.DECIMAL(11, 8),
      allowNull: true,
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('AddressUsers', 'lat');
    await queryInterface.removeColumn('AddressUsers', 'lng');
  },
};

