require('dotenv').config();

module.exports = {
  development: {
    username: "foodorder_1vhr_user",
    password: "lZvzLFSaMvLRfk7hIdbcaJ9Si8IdYC7Y",
    database: "foodorder_1vhr", 
    host: "dpg-cuh5372j1k6c73b5nup0-a",
    port: 5432,
    dialect: "postgres"
  },
  test: {
    username: "foodorder_1vhr_user",
    password: "lZvzLFSaMvLRfk7hIdbcaJ9Si8IdYC7Y",
    database: "foodorder_1vhr",
    host: "dpg-cuh5372j1k6c73b5nup0-a",
    port: 5432,
    dialect: "postgres"
  },
  production: {
    username: process.env.DB_USERNAME || "foodorder_1vhr_user",
    password: process.env.DB_PASSWORD || "lZvzLFSaMvLRfk7hIdbcaJ9Si8IdYC7Y",
    database: process.env.DB_NAME_PROD || "foodorder_1vhr",
    host: process.env.DB_HOST || "dpg-cuh5372j1k6c73b5nup0-a",
    port: 5432,
    dialect: "postgres"
  }
};
