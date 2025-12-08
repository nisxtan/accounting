const { EntitySchema, JoinColumn } = require("typeorm");

module.exports = new EntitySchema({
  name: "Customer",
  tableName: "customers",
  columns: {
    id: { primary: true, type: "int", generated: true },
    fullName: { type: "varchar", required: true, nullable: false, length: 255 },
    email: { type: "varchar", unique: true },
    phone: { type: "varchar", unique: true, length: 15 },
    address: { type: "text", nullable: true },
    status: { type: "boolean" },
    createdAt: { type: "timestamp", createDate: true },
    updatedAt: { type: "timestamp", updateDate: true },
  },
  relations: {
    bills: {
      type: "one-to-many",
      target: "SalesBill",
      inverseSide: "customer",
    },
    createdBy: {
      type: "many-to-one",
      target: "User",
      inverseSide: "createdCustomers",
      joinColumn: {
        name: "createdById",
        referencedColumnName: "id",
      },
      nullable: true,
    },
  },
});
