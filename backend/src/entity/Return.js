const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Return",
  tableName: "returns",
  columns: {
    id: {
      primary: true,
      type: "int",
      generated: true,
    },
    returnNumber: {
      type: "varchar",
      unique: true,
      nullable: false,
    },
    returnDate: {
      type: "date",
      default: () => "CURRENT_DATE",
      nullable: false,
    },
    originalInvoiceNumber: {
      type: "varchar",
      nullable: false,
    },
    billId: {
      type: "int",
      nullable: false,
    },
    customerId: {
      type: "int",
      nullable: false,
    },
    userId: {
      type: "int",
      nullable: false,
    },
    reason: {
      type: "text",
      nullable: true,
    },
    status: {
      type: "enum",
      enum: ["pending", "approved", "rejected", "completed"],
      default: "pending",
    },
    subTotal: {
      type: "float",
      default: 0,
    },
    vatAmount: {
      type: "float",
      default: 0,
    },
    totalRefundAmount: {
      type: "float",
      default: 0,
    },
    isFullyReturned: {
      type: "boolean",
      default: false,
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
    bill: {
      type: "many-to-one",
      target: "SalesBill",
      joinColumn: {
        name: "billId",
        referencedColumnName: "id",
      },
      nullable: false,
      onDelete: "RESTRICT", // Prevent deleting original bill if returns exist
    },
    customer: {
      type: "many-to-one",
      target: "Customer",
      joinColumn: {
        name: "customerId",
        referencedColumnName: "id",
      },
      nullable: false,
    },
    user: {
      type: "many-to-one",
      target: "User",
      joinColumn: {
        name: "userId",
        referencedColumnName: "id",
      },
      nullable: false,
    },
    returnItems: {
      type: "one-to-many",
      target: "ReturnItem",
      inverseSide: "return",
    },
  },
});
