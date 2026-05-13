'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();
    await queryInterface.bulkInsert('Allcodes', [
      {
        type: 'STATUS-ORDER',
        value: 'Giao thất bại',
        code: 'S8',
        createdAt: now,
        updatedAt: now,
      },
    ]);
  },
  down: async (queryInterface) => {
    await queryInterface.bulkDelete('Allcodes', { code: 'S8' });
  },
};

