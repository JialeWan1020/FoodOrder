const { sequelize } = require('./models');

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    
    // Test Order model
    const { Order } = require('./models');
    const orders = await Order.findAll();
    console.log('Successfully queried orders:', orders.length);
    
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  } finally {
    await sequelize.close();
  }
}

testConnection(); 