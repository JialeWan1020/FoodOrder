const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const hashedPassword = await bcrypt.hash('admin88', 10);
    await queryInterface.bulkInsert('Users', [{
      username: 'admin',
      password: hashedPassword,
      email: 'admin@example.com', // Use a placeholder email
      phone: '1234567890', // Use a placeholder phone number
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Users', { username: 'admin' }, {});
  }
}; 