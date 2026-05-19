'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn('orderproducts', 'statusReason', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    } catch (e) {
      if (!e.message.includes('Duplicate column name')) throw e;
    }
  },
  down: async (queryInterface) => {
    try { await queryInterface.removeColumn('orderproducts', 'statusReason'); } catch (e) {}
  },
};
