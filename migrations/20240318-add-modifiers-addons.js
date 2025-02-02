'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('MenuItems', 'modifiers', {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {
        ice: {
          available: false,
          options: ['Regular', 'Less', 'No']
        },
        sugar: {
          available: false,
          options: ['100%', '70%', '50%', '30%', '0%']
        }
      }
    });

    await queryInterface.addColumn('MenuItems', 'addOns', {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: []
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('MenuItems', 'modifiers');
    await queryInterface.removeColumn('MenuItems', 'addOns');
  }
}; 