'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('MenuItems', [
      {
        name: 'Margherita Pizza',
        description: 'Classic Italian pizza with tomato and mozzarella',
        price: 12.99,
        category: 'Pizza',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Pepperoni Pizza',
        description: 'Pizza with tomato sauce, mozzarella, and pepperoni',
        price: 14.99,
        category: 'Pizza',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Caesar Salad',
        description: 'Fresh romaine lettuce with Caesar dressing and croutons',
        price: 8.99,
        category: 'Salad',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('MenuItems', null, {});
  }
};