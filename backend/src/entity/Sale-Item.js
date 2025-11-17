const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "SalesItem",
  tableName: "sales_items",
  columns: {
    id: { primary: true, type: "int", generated: true },
    quantity: { type: "int" },
    unit: { type: "varchar" },
    isTaxable: { type: "boolean" },
    rate: { type: "float" },

    discountPercent: { type: "float", default: 0 },
    discountAmount: { type: "float", default: 0 },
    total: { type: "float" },
  },
  relations: {
    //relation to product
    product: {
      type: "many-to-one",
      target: "Product",
      joinColumn: true,
      inverseSide: "salesItems",
      onDelete: "SET NULL",
    },
    //relation to bill
    bill: {
      type: "many-to-one",
      target: "SalesBill",
      joinColumn: true,
      inverseSide: "items",
      onDelete: "CASCADE",
    },
  },
});
