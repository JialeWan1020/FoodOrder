require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USERNAME || "postgres",
    password: process.env.DB_PASSWORD || "your_password",
    database: process.env.DB_NAME || "food_order_db",
    host: process.env.DB_HOST || "127.0.0.1",
    dialect: "postgres"
  },
  test: {
    username: process.env.DB_USERNAME || "postgres",
    password: process.env.DB_PASSWORD || "your_password",
    database: process.env.DB_NAME_TEST || "food_order_db_test",
    host: process.env.DB_HOST || "127.0.0.1",
    dialect: "postgres"
  },
  production: {
    username: process.env.DB_USERNAME || "postgres",
    password: process.env.DB_PASSWORD || "your_password",
    database: process.env.DB_NAME_PROD || "food_order_db_prod",
    host: process.env.DB_HOST || "127.0.0.1",
    dialect: "postgres"
  }
};
