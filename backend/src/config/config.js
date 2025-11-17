require("dotenv").config();

const DBConfig = {
  PORT: process.env.PORT,
  DB_HOST: process.env.DB_HOST || "localhost",
  DB_PORT: process.env.DB_PORT || 5432,
  DB_USER: process.env.DB_USER || "postgres",
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_NAME: process.env.DB_NAME || "accounting",
};
// console.log(DBConfig);

module.exports = { DBConfig };
