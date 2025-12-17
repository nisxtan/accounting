const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "ReturnItem",
  tableName: "return_items",
  columns: {
    id: { primary: true, generated: true, type: "int" },
    returnId: {
      type: "int",
      nullable: false,
    },
    productId: { type: "int", nullable: false },
    originalSalesItemid: { type: "int", nullable: false },
    originalQuantity: { type: "int", nullable: false },
    returnedQuantity: { type: "int", nullable: false },
    unit: {
      type: "varchar",
      default: "Pcs",
    },
    originalRate: { type: "float", default: 0 },
    returnedRate: { type: "float", default: 0 },
    isTaxable: { type: "boolean", default: true },
    reason: {
      type: "varchar",
      nullable: true,
    },
    createdAt: { type: "timestamp", createDate: true },
    updatedAt: { type: "timestamp", updateDate: true },
  },
  relations: {
    return: {
      type: "many-to-one",
      target: "Return",
      joinColumn: {
        name: "returnId",
        referencedColumnName: "id",
      },
      inverseSide: "returnItems",
      onDelete: "CASCADE",
    },
    product: {
      type: "many-to-one",
      target: "Product",
      joinColumn: {
        name: "productId",
        referencedColumnName: "id",
      },
      nullabe: false,
    },

    originalSalesItem: {
      type: "many-to-one",
      target: "SalesItem",
      joinColumn: {
        name: "originalSalesItemid",
        referencedColumnName: "id",
      },
      nullable: false,
    },
  },
});
