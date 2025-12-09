const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Return",
  tableName: "returns",
  columns: {
    id: { primary: true, type: "int", generated: true },
    originalInvoiceNumber: { type: "varchar", nullable: false },
    salesData: { type: "date", nullable: false },
    customer: { type: "varchar", nullable: false },
    productId: {
      type: "int",
      nullable: true,
    },
    billId: {
      type: "int",
      nullable: false,
    },
    quantity: { type: "int" },
    unit: { type: "varchar", default: "Pcs" },
    isTaxable: { type: "boolean" },
    rate: { type: "float", default: 0 },
    discountPercent: { type: "float", default: 0 },
    total: { type: "float", default: 0 },
  },

  relations: {
    bill: {
      type: "many-to-one",
      target: "SalesBll",
      joinColumn: "billId",
      inverseSide: "returns",
      onDelete: "CASCADE",
    },
    // product: {
    //   type: "many-to-one",
    //   target: "Product",
    //   joinColumn: { name: "productId" },
    //   inverseSide: "salesItems",
    //   onDelete: "SET NULL",
    // },
  },
});
