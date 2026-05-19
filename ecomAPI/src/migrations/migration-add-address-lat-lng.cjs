'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn('addressusers', 'lat', {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: true,
      });
    } catch (e) {
      if (!e.message.includes('Duplicate column name')) throw e;
    }
    
    try {
      await queryInterface.addColumn('addressusers', 'lng', {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: true,
      });
    } catch (e) {
      if (!e.message.includes('Duplicate column name')) throw e;
    }
  },
  down: async (queryInterface) => {
    try { await queryInterface.removeColumn('addressusers', 'lat'); } catch (e) {}
    try { await queryInterface.removeColumn('addressusers', 'lng'); } catch (e) {}
  },
};
