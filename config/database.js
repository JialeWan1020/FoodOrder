module.exports = {
  development: {
    username: process.env.DB_USERNAME || 'myuser',
    password: process.env.DB_PASSWORD || 'mypassword',
    database: process.env.DB_NAME || 'food_order_db',
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres'
  },
  test: {
    // Test configuration
  },
  production: {
    // Production configuration
  }
}; 