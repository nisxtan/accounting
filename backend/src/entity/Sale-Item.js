const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "SalesItem",
  tableName: "sales_items",
  columns: {
    id: { primary: true, type: "int", generated: true },

    // foreign key columns
    productId: {
      type: "int",
      nullable: true,
    },
    billId: {
      type: "int",
      nullable: false, // Required - item must belong to a bill
    },

    quantity: { type: "int" },
    baseQuantity: { type: "int", default: 0 },
    unit: { type: "varchar" },
    isTaxable: { type: "boolean" },
    rate: { type: "float" },
    adjustedRate: { type: "float", default: 0 },
    discountPercent: { type: "float", default: 0 },
    discountAmount: { type: "float", default: 0 },
    billDiscountAmount: { type: "float", default: 0 },
    total: { type: "float" },
  },
  relations: {
    // Relation to product
    product: {
      type: "many-to-one",
      target: "Product",
      joinColumn: { name: "productId" }, // map to productId column
      inverseSide: "salesItems",
      onDelete: "SET NULL",
    },
    // Relation to bill
    bill: {
      type: "many-to-one",
      target: "SalesBill",
      joinColumn: { name: "billId" }, // map to billId column
      inverseSide: "items",
      onDelete: "CASCADE",
    },
  },
});
