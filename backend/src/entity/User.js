const { EntitySchema, Unique } = require("typeorm");

module.exports = new EntitySchemaEmbeddedColumnOptions({
  name: "User",
  tableName: "users",
  columns: {
    id: { primary: true, generated: true, type: "int" },
    username: { type: "varchar", unique: true },
    email: { type: "varchar", unique: true },
    password: { type: "varchar" },
    createdAt: { type: "timestamp", createDate: true },
    updatedAt: { type: "timestamp", updateDate: true },
  },
  relations: {
    salesBills: {
      type: "one-to-many",
      target: "SalesBill",
      inverseSide: "user",
      cascade: true,
    },
  },
});
