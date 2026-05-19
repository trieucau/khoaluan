'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();
    try {
      await queryInterface.bulkInsert('allcodes', [
        {
          type: 'STATUS-ORDER',
          value: 'Giao thất bại',
          code: 'S8',
          createdAt: now,
          updatedAt: now,
        },
      ]);
    } catch (e) {
      if (e.name !== 'SequelizeUniqueConstraintError' && !e.message.includes('Duplicate entry')) throw e;
    }
  },
  down: async (queryInterface) => {
    await queryInterface.bulkDelete('allcodes', { code: 'S8' });
  },
};
