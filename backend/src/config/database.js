const { DataSource } = require("typeorm");
const { DBConfig } = require("./config");
const Product = require("../entity/Product");
const SaleItem = require("../entity/Sale-Item");
const SalesBill = require("../entity/Sales-bill");
const InvoiceReservation = require("../entity/InvoiceReservation");
const User = require("../entity/User");
const AppDataSource = new DataSource({
  type: "postgres",
  host: DBConfig.DB_HOST,
  port: DBConfig.DB_PORT,
  username: DBConfig.DB_USER,
  password: DBConfig.DB_PASSWORD,
  database: DBConfig.DB_NAME,
  synchronize: true,
  logging: false,
  entities: [Product, SaleItem, SalesBill, InvoiceReservation, User],
});

module.exports = { AppDataSource };
