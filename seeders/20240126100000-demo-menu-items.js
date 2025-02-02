'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('MenuItems', [
      {
        name: 'Classic Burger',
        description: 'Juicy beef patty with lettuce, tomato, and special sauce',
        price: 12.99,
        category: 'Burgers',
        image: '/images/classic-burger.jpg',
        isAvailable: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Margherita Pizza',
        description: 'Fresh tomatoes, mozzarella, and basil',
        price: 14.99,
        category: 'Pizza',
        image: '/images/margherita-pizza.jpg',
        isAvailable: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Caesar Salad',
        description: 'Crisp romaine lettuce, croutons, parmesan cheese with Caesar dressing',
        price: 8.99,
        category: 'Salads',
        image: '/images/caesar-salad.jpg',
        isAvailable: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Chicken Wings',
        description: 'Crispy wings with choice of BBQ, Buffalo, or Garlic Parmesan sauce',
        price: 10.99,
        category: 'Appetizers',
        image: '/images/chicken-wings.jpg',
        isAvailable: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('MenuItems', null, {});
  }
}; 