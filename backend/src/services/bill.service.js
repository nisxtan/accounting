const { AppDataSource } = require("../config/database");
const Product = require("../entity/Product");
const SaleItem = require("../entity/Sale-Item");
const SalesBill = require("../entity/Sales-bill");
const salesItemService = require("./salesItem.service");

class BillService {
  calculateBillTotals(items, billDiscountPercent = 0, vatPercent = 13) {
    let subtotal = 0;
    let taxableTotal = 0;
    let nonTaxableTotal = 0;

    const calculatedItems = items.map((item) => {
      const row = salesItemService.calculateRowTotal(item);
      subtotal += row.finalTotal;

      if (item.isTaxable) {
        taxableTotal += row.finalTotal;
      } else {
        nonTaxableTotal += row.finalTotal;
      }
      return row;
    });

    const discountAmount = subtotal * (billDiscountPercent / 100);
    const afterDiscount = subtotal - discountAmount;
    // VAT only applies to taxable goods
    const vatAmount = taxableTotal * (vatPercent / 100);
    const grandTotal = afterDiscount + vatAmount;

    return {
      subtotal,
      discountAmount,
      afterDiscount,
      taxableTotal,
      nonTaxableTotal,
      vatAmount,
      grandTotal,
      calculatedItems,
    };
  }

  async createCompleteBill(billData) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // validate all products exist BEFORE starting transaction
      const productRepository = queryRunner.manager.getRepository(Product);

      for (const itemData of billData.items) {
        const product = await productRepository.findOne({
          where: { id: itemData.productId },
        });

        if (!product) {
          throw new Error(
            `Product with ID ${itemData.productId} does not exist`
          );
        }

        //Check stock availability
        const requiredQty = salesItemService.getBaseQuantity(
          itemData.quantity,
          itemData.unit
        );

        if (product.quantity < requiredQty) {
          throw new Error(
            `Insufficient stock for ${product.name}. Required: ${requiredQty}, Available: ${product.quantity}`
          );
        }
      }

      // Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber();

      // Calculate totals
      const totals = this.calculateBillTotals(
        billData.items,
        billData.discountPercent,
        billData.vatPercent
      );

      const billRepository = queryRunner.manager.getRepository(SalesBill);
      const bill = billRepository.create({
        invoiceNumber,
        salesDate: billData.salesDate,
        customer: billData.customer,
        subTotal: totals.subtotal,
        discountPercent: billData.discountPercent || 0,
        discountAmount: totals.discountAmount,
        taxableTotal: totals.taxableTotal,
        nonTaxableTotal: totals.nonTaxableTotal,
        vatPercent: billData.vatPercent || 13,
        vatAmount: totals.vatAmount,
        grandTotal: totals.grandTotal,
      });
      const savedBill = await billRepository.save(bill);

      // Create sales items and update product quantities
      const itemRepository = queryRunner.manager.getRepository(SaleItem);

      for (const itemData of billData.items) {
        const baseQuantity = salesItemService.getBaseQuantity(
          itemData.quantity,
          itemData.unit
        );

        const calculatedItem = totals.calculatedItems.find(
          (i) => i.baseQuantity === baseQuantity
        );

        if (!calculatedItem) {
          throw new Error(
            `Calculation error for item with quantity ${itemData.quantity}`
          );
        }

        //Explicitly set productId and billId
        const salesItem = itemRepository.create({
          productId: itemData.productId, // Explicit foreign key
          billId: savedBill.id, // Explicit foreign key
          quantity: itemData.quantity,
          unit: itemData.unit,
          rate: itemData.rate,
          isTaxable: itemData.isTaxable,
          discountPercent: itemData.discountPercent || 0,
          discountAmount: calculatedItem.discountAmount,
          total: calculatedItem.finalTotal,
          product: { id: itemData.productId }, //set relation
          bill: savedBill, // set relation
        });

        await itemRepository.save(salesItem);

        // Update product quantity
        await productRepository.decrement(
          { id: itemData.productId },
          "quantity",
          baseQuantity
        );
      }

      await queryRunner.commitTransaction();

      // Return complete bill with relations
      const completeBill = await billRepository.findOne({
        where: { id: savedBill.id },
        relations: ["items", "items.product"],
      });

      return completeBill;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async generateInvoiceNumber() {
    const billRepository = AppDataSource.getRepository(SalesBill);
    const billCount = await billRepository.count();
    return `INV-${String(billCount + 1).padStart(4, "0")}`;
  }
}

module.exports = new BillService();
