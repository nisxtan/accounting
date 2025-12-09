const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "SalesBill",
  tableName: "sales_bills",
  columns: {
    id: {
      primary: true,
      type: "int",
      generated: true,
    },
    invoiceNumber: {
      type: "varchar",
      nullable: true,
      unique: true,
    },
    salesDate: {
      type: "date",
    },
    subTotal: {
      type: "float",
      default: 0,
    },
    discountPercent: {
      type: "float",
      default: 0,
    },
    discountAmount: {
      type: "float",
      default: 0,
    },
    taxableTotal: {
      type: "float",
      default: 0,
    },
    nonTaxableTotal: {
      type: "float",
      default: 0,
    },
    vatPercent: {
      type: "int",
      default: 13,
    },
    vatAmount: {
      type: "float",
      default: 0,
    },
    grandTotal: {
      type: "float",
      default: 0,
    },
    createdAt: {
      type: "timestamp",
      createDate: true,
    },
    updatedAt: {
      type: "timestamp",
      updateDate: true,
    },
  },
  relations: {
    items: {
      type: "one-to-many",
      target: "SalesItem",
      inverseSide: "bill",
    },
    customer: {
      type: "many-to-one",
      target: "Customer",
      inverseSide: "bills",
      joinColumn: {
        name: "customerId",
        referencedColumnName: "id",
      },
      nullable: false,
    },
    user: {
      type: "many-to-one",
      target: "User",
      inverseSide: "salesBills",
      joinColumn: {
        name: "userId",
        referencedColumnName: "id",
      },
      nullable: true,
    },
    return: {
      type: "one-to-many",
      target: "Return",
      inverseSide: "bill",
    },
  },
});
