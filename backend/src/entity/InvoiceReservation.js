const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "InvoiceReservation",
  tableName: "invoice_reservations",
  columns: {
    id: { primary: true, type: "int", generated: true },
    invoiceNumber: { type: "varchar", unique: true },
    inProgress: { type: "boolean", default: false },
    isUsed: { type: "boolean", default: false },
    createdAt: { type: "timestamp", createDate: true },
    lastUsed: { type: "timestamp", default: () => "CURRENT_TIMESTAMP" },
  },
});
