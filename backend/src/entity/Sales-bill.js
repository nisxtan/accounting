const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "SalesBill",
  tableName: "sales_bills",
  columns: {
    id: { primary: true, type: "int", generated: true },
    invoiceNumber: { type: "varchar" },
    salesDate: { type: "date" },
    customer: { type: "varchar" },

    subTotal: { type: "float", default: 0 },
    discountPercent: { type: "float", default: 0 },

    taxableTotal: {
      type: "float",
      default: 0,
    },
    nonTaxableTotal: { type: "float", default: 0 },

    vatPercent: { type: "int", default: 13 },
    grandTotal: { type: "float", default: 0 },

    createdAt: { type: "timestamp", createDate: true },
    updatedAt: { type: "timestamp", updateDate: true },
  },

  relations: {
    items: { type: "one-to-many", target: "SalesItem", inverseSide: "bill" },
    // cascade: true,
  },
});
