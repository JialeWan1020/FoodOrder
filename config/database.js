module.exports = {
  development: {
    username: process.env.DB_USERNAME || 'foodorder_1vhr_user',  
    password: process.env.DB_PASSWORD || 'lZvzLFSaMvLRfk7hIdbcaJ9Si8IdYC7Y',
    database: process.env.DB_NAME || 'foodorder_1vhr',
    host: process.env.DB_HOST || 'dpg-cuh5372j1k6c73b5nup0-a',
    dialect: 'postgres'
  },
  test: {
    // Test configuration for foodorder_1vhr
  },
  production: {
    // Production configuration for foodorder_1vhr  
  }
}; 