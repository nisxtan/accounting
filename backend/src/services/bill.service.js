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
      const salesDate = new Date(billData.salesDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      salesDate.setHours(0, 0, 0, 0);
      if (salesDate > today) {
        throw new Error("Sales date cannot be in the future");
      }
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
      const invoiceNumber = billData.invoiceNumber;
      // Calculate totals
      const totals = this.calculateBillTotals(
        billData.items,
        billData.discountPercent,
        billData.vatPercent
      );

      //save salesBill
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

      await this.markInvoiceNumberAsUsed(billData.invoiceNumber);

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
          individualRate: calculatedItem.finalTotal / baseQuantity,
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
  //   const reservationRepository =
  //     AppDataSource.getRepository("InvoiceReservation");

  //   try {
  //     // Use PostgreSQL's NOW() function to calculate 10 minutes ago
  //     const expiredReservations = await reservationRepository
  //       .createQueryBuilder("reservation")
  //       .where("reservation.inProgress = :inProgress", { inProgress: true })
  //       .andWhere("reservation.isUsed = :isUsed", { isUsed: false })
  //       .andWhere("reservation.lastUsed < NOW() - INTERVAL '10 minutes'") // ⭐ PostgreSQL time check
  //       .getMany();

  //     // If there are expired reservations, use the first one
  //     if (expiredReservations.length > 0) {
  //       const expiredReservation = expiredReservations[0];
  //       expiredReservation.lastUsed = new Date();
  //       const updated = await reservationRepository.save(expiredReservation);
  //       console.log("🔄 Reused expired reservation:", updated.invoiceNumber);
  //       return updated.invoiceNumber;
  //     }

  //     // Find the highest invoice number
  //     const lastReservation = await reservationRepository
  //       .createQueryBuilder("reservation")
  //       .select("reservation.invoiceNumber")
  //       .orderBy("reservation.invoiceNumber", "DESC")
  //       .getOne();

  //     let startNumber = 1;
  //     if (lastReservation) {
  //       const lastNum = parseInt(lastReservation.invoiceNumber.split("-")[1]);
  //       startNumber = lastNum + 1;
  //     }

  //     // Find available number
  //     let checkNumber = startNumber;
  //     while (true) {
  //       const newInvoiceNumber = `INV-${String(checkNumber).padStart(4, "0")}`;

  //       // Check if number exists and is available
  //       const foundReservation = await reservationRepository.findOne({
  //         where: { invoiceNumber: newInvoiceNumber },
  //       });

  //       if (!foundReservation) {
  //         // Create new reservation
  //         const newReservation = reservationRepository.create({
  //           invoiceNumber: newInvoiceNumber,
  //           inProgress: true,
  //           isUsed: false,
  //           lastUsed: new Date(),
  //         });
  //         const saved = await reservationRepository.save(newReservation);
  //         console.log("🆕 Created new reservation:", saved.invoiceNumber);
  //         return saved.invoiceNumber;
  //       }

  //       // If reservation exists but is available
  //       if (!foundReservation.inProgress && !foundReservation.isUsed) {
  //         foundReservation.inProgress = true;
  //         foundReservation.lastUsed = new Date();
  //         const updated = await reservationRepository.save(foundReservation);
  //         console.log(
  //           "📝 Activated available reservation:",
  //           updated.invoiceNumber
  //         );
  //         return updated.invoiceNumber;
  //       }

  //       checkNumber++;
  //     }
  //   } catch (error) {
  //     console.error("Error generating invoice number:", error);
  //     return `INV-${Date.now()}`;
  //   }
  // }

  // async markInvoiceNumberAsUsed(invoiceNumber) {
  //   const reservationRepo = AppDataSource.getRepository("InvoiceReservation");

  //   try {
  //     console.log("🔍 Marking invoice as used:", invoiceNumber);

  //     const result = await reservationRepo
  //       .createQueryBuilder()
  //       .update()
  //       .set({
  //         isUsed: true,
  //         inProgress: false,
  //         lastUsed: () => "NOW()",
  //       })
  //       .where("invoiceNumber = :invoiceNumber", { invoiceNumber })
  //       .andWhere("isUsed = false")
  //       .execute();

  //     if (result.affected > 0) {
  //       console.log("✅ Successfully marked as used:", invoiceNumber);
  //     } else {
  //       console.log("⚠️ Invoice already used or not found:", invoiceNumber);
  //     }
  //   } catch (error) {
  //     console.error("Error marking invoice as used:", error);
  //   }
  // }

  // Replace your generateInvoiceNumber and markInvoiceNumberAsUsed methods with these:

  async generateInvoiceNumber() {
    const reservationRepository =
      AppDataSource.getRepository("InvoiceReservation");

    try {
      //Clean up expired reservations
      await reservationRepository
        .createQueryBuilder()
        .update()
        .set({
          inProgress: false,
          lastUsed: () => "NOW()",
        })
        .where("inProgress = :inProgress", { inProgress: true })
        .andWhere("isUsed = :isUsed", { isUsed: false })
        .andWhere("lastUsed < NOW() - INTERVAL '10 minutes'")
        .execute();

      //Try to find an available reservation (not in progress, not used)
      const availableReservation = await reservationRepository
        .createQueryBuilder("reservation")
        .where("reservation.inProgress = :inProgress", { inProgress: false })
        .andWhere("reservation.isUsed = :isUsed", { isUsed: false })
        .orderBy("reservation.invoiceNumber", "ASC")
        .getOne();

      if (availableReservation) {
        // Mark it as in progress
        availableReservation.inProgress = true;
        availableReservation.lastUsed = new Date();
        const updated = await reservationRepository.save(availableReservation);
        console.log("📝 Reusing available reservation:", updated.invoiceNumber);
        return updated.invoiceNumber;
      }

      // Step 3: If no available reservation, create a new one
      // Find the highest invoice number
      const lastReservation = await reservationRepository
        .createQueryBuilder("reservation")
        .select("reservation.invoiceNumber")
        .orderBy("reservation.invoiceNumber", "DESC")
        .getOne();

      let nextNumber = 1;
      if (lastReservation) {
        const lastNum = parseInt(lastReservation.invoiceNumber.split("-")[1]);
        nextNumber = lastNum + 1;
      }

      const newInvoiceNumber = `INV-${String(nextNumber).padStart(4, "0")}`;

      // Create new reservation
      const newReservation = reservationRepository.create({
        invoiceNumber: newInvoiceNumber,
        inProgress: true,
        isUsed: false,
        lastUsed: new Date(),
      });

      const saved = await reservationRepository.save(newReservation);
      console.log("🆕 Created new reservation:", saved.invoiceNumber);
      return saved.invoiceNumber;
    } catch (error) {
      console.error("Error generating invoice number:", error);
      // Fallback to timestamp-based number
      return `INV-${Date.now()}`;
    }
  }

  async markInvoiceNumberAsUsed(invoiceNumber) {
    const reservationRepo = AppDataSource.getRepository("InvoiceReservation");

    try {
      console.log("🔍 Marking invoice as used:", invoiceNumber);

      const result = await reservationRepo
        .createQueryBuilder()
        .update()
        .set({
          isUsed: true,
          inProgress: false,
          lastUsed: () => "NOW()",
        })
        .where("invoiceNumber = :invoiceNumber", { invoiceNumber })
        .execute();

      if (result.affected > 0) {
        console.log("✅ Successfully marked as used:", invoiceNumber);
        return true;
      } else {
        console.log("⚠️ Invoice not found:", invoiceNumber);
        return false;
      }
    } catch (error) {
      console.error("Error marking invoice as used:", error);
      throw error;
    }
  }
}

module.exports = new BillService();
