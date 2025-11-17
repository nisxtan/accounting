const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Product",
  tableName: "products",
  columns: {
    id: {
      primary: true,
      type: "int",
      generated: true,
    },
    name: { type: "varchar", unique: true },
    quantity: { type: "int" },
    isTaxable: { type: "boolean", default: true },
    createdAt: { type: "timestamp", createDate: true },
    updatedAt: { type: "timestamp", updateDate: true },
  },
  relations: {
    //relation with salesItem
    salesItems: {
      type: "one-to-many",
      target: "SalesItem",
      inverseSide: "product",
    },
  },
});
