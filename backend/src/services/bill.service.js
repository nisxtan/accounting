const { AppDataSource } = require("../config/database");
const Product = require("../entity/Product");
const SaleItem = require("../entity/Sale-Item");
const SalesBill = require("../entity/Sales-bill");
const salesItemService = require("./salesItem.service");

class BillService {
  calculateBillTotals(items, billDiscountPercent = 0, vatPercent = 13) {
    let subTotal = 0;

    const calculatedItems = items.map((item) => {
      const row = salesItemService.calculateRowTotal(item);
      subTotal += row.finalTotal; // item level total before bill discount
      return row;
    });

    //!apply bill discount proportionately per item
    calculatedItems.forEach((item, index) => {
      const billDiscountAmount = item.finalTotal * (billDiscountPercent / 100);
      const afterBillDiscount = item.finalTotal - billDiscountAmount;

      //store per item discount results
      item.billDiscountAmount = billDiscountAmount;
      item.afterBillDiscount = afterBillDiscount;
    });

    //!apply VAT to only taxable items
    calculatedItems.forEach((item) => {
      if (item.isTaxable) {
        item.vatAmount = item.afterBillDiscount * (vatPercent / 100);
        item.afterVat = item.afterBillDiscount + item.vatAmount;
      } else {
        item.vatAmount = 0;
        item.afterVat = item.afterBillDiscount;
      }
    });

    //aggregate totals
    const discountAmount = calculatedItems.reduce(
      (sum, i) => sum + i.billDiscountAmount,
      0
    );

    const taxableTotal = calculatedItems
      .filter((i) => i.isTaxable)
      .reduce((sum, i) => sum + i.afterBillDiscount, 0);

    const nonTaxableTotal = calculatedItems
      .filter((i) => !i.isTaxable)
      .reduce((sum, i) => sum + i.afterBillDiscount, 0);

    const vatAmount = calculatedItems.reduce((sum, i) => sum + i.vatAmount, 0);

    const grandTotal = calculatedItems.reduce((sum, i) => sum + i.afterVat, 0);
    return {
      subTotal,
      discountAmount,
      taxableTotal,
      nonTaxableTotal,
      vatAmount,
      grandTotal,
      calculatedItems, // all item level calculations
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
      // const invoiceNumber = await this.generateInvoiceNumber();
      const invoiceNumber = billData.invoiceNumber;
      // Calculate totals
      const totals = this.calculateBillTotals(
        billData.items,
        billData.discountPercent,
        billData.vatPercent
      );

      //save sakesBill
      const billRepository = queryRunner.manager.getRepository(SalesBill);
      const bill = billRepository.create({
        invoiceNumber,
        salesDate: billData.salesDate,
        customer: billData.customer,
        subTotal: totals.subTotal,
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

      for (let i = 0; i < billData.items.length; i++) {
        const itemData = billData.items[i];
        const calculatedItem = totals.calculatedItems[i];
        const baseQuantity = salesItemService.getBaseQuantity(
          itemData.quantity,
          itemData.unit
        );

        //Explicitly set productId and billId
        const salesItem = itemRepository.create({
          productId: itemData.productId, // Explicit foreign key
          billId: savedBill.id, // Explicit foreign key
          quantity: itemData.quantity,
          unit: itemData.unit,
          baseQuantity: baseQuantity,
          rate: itemData.rate,
          adjustedRate: calculatedItem.afterVat / baseQuantity,
          isTaxable: itemData.isTaxable,
          discountPercent: itemData.discountPercent || 0,
          discountAmount: calculatedItem.discountAmount,
          billDiscountAmount: calculatedItem.billDiscountAmount,
          total: calculatedItem.afterVat,
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

  // async generateInvoiceNumber() {
  //   const billRepository = AppDataSource.getRepository(SalesBill);
  //   const billCount = await billRepository.count();
  //   return `INV-${String(billCount + 1).padStart(4, "0")}`;
  // }
}

module.exports = new BillService();
