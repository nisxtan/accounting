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

      const invoiceNumber = billData.invoiceNumber;

      const reservationRepo = AppDataSource.getRepository("InvoiceReservation");
      const reservation = await reservationRepo.findOne({
        where: { invoiceNumber: invoiceNumber },
      });

      if (!reservation) {
        throw new Error(`Invoice number ${invoiceNumber} does not exist`);
      }

      if (reservation.isUsed) {
        throw new Error(
          `Invoice number ${invoiceNumber} has already been used`
        );
      }

      if (!billData.customerId) {
        throw new Error("Customer ID is required");
      }

      const customerRepository = queryRunner.manager.getRepository("Customer");
      const customer = await customerRepository.findOne({
        where: { id: billData.customerId },
      });

      if (!customer) {
        throw new Error(`Customer with ID ${billData.customerId} not found`);
      }

      if (!billData.userId) {
        throw new Error("User ID is required");
      }

      const userRepository = queryRunner.manager.getRepository("User");
      const user = await userRepository.findOne({
        where: { id: billData.userId },
      });

      if (!user) {
        throw new Error(`User with ID ${billData.userId} not found`);
      }

      // Validate all products exist BEFORE starting transaction
      const productRepository = queryRunner.manager.getRepository("Product");
      for (const itemData of billData.items) {
        const product = await productRepository.findOne({
          where: { id: itemData.productId },
        });
        if (!product) {
          throw new Error(
            `Product with ID ${itemData.productId} does not exist`
          );
        }

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

      // Calculate totals
      const totals = this.calculateBillTotals(
        billData.items,
        billData.discountPercent,
        billData.vatPercent
      );

      // Save salesBill
      const billRepository = queryRunner.manager.getRepository("SalesBill");
      const bill = billRepository.create({
        invoiceNumber,
        salesDate: billData.salesDate,
        customer: customer, // link customer
        user: user, // link user properly
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

      await this.markInvoiceNumberAsUsed(invoiceNumber);

      // Create sales items and update product quantities
      const itemRepository = queryRunner.manager.getRepository("SalesItem");
      for (let i = 0; i < billData.items.length; i++) {
        const itemData = billData.items[i];
        const calculatedItem = totals.calculatedItems[i];
        const baseQuantity = salesItemService.getBaseQuantity(
          itemData.quantity,
          itemData.unit
        );

        const salesItem = itemRepository.create({
          productId: itemData.productId,
          billId: savedBill.id,
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
          product: { id: itemData.productId },
          bill: savedBill,
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
        relations: ["items", "items.product", "customer", "user"], // include user
      });

      return completeBill;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async generateInvoiceNumber(prefix = "INV") {
    const reservationRepository =
      AppDataSource.getRepository("InvoiceReservation");

    // Clean up expired reservations
    await reservationRepository
      .createQueryBuilder()
      .update()
      .set({
        inProgress: false,
        lastUsed: () => "NOW()",
      })
      .where("inProgress = :inProgress", { inProgress: true })
      .andWhere("isUsed = :isUsed", { isUsed: false })
      .andWhere("lastUsed < NOW() - INTERVAL '2 minutes'")
      .execute();

    // Try to find an available reservation with the given prefix
    const availableReservation = await reservationRepository
      .createQueryBuilder("reservation")
      .where("reservation.inProgress = :inProgress", { inProgress: false })
      .andWhere("reservation.isUsed = :isUsed", { isUsed: false })
      .andWhere("reservation.invoiceNumber LIKE :prefix", {
        prefix: prefix + "-%",
      })
      .orderBy("reservation.invoiceNumber", "ASC")
      .getOne();

    if (availableReservation) {
      // Mark it as in progress
      availableReservation.inProgress = true;
      availableReservation.lastUsed = new Date();
      const updated = await reservationRepository.save(availableReservation);
      // console.log(
      //   `📝 Reusing available ${prefix} reservation:`,
      //   updated.invoiceNumber
      // );
      return updated.invoiceNumber;
    }

    // If no available reservation, create a new one
    // Find the highest invoice number with this prefix
    const lastReservation = await reservationRepository
      .createQueryBuilder("reservation")
      .select("reservation.invoiceNumber")
      .where("reservation.invoiceNumber LIKE :prefix", {
        prefix: prefix + "-%",
      })
      .orderBy("reservation.invoiceNumber", "DESC")
      .getOne();

    let nextNumber = 1;
    if (lastReservation) {
      const lastNum = parseInt(lastReservation.invoiceNumber.split("-")[1]);
      nextNumber = lastNum + 1;
    }

    const newInvoiceNumber = `${prefix}-${String(nextNumber).padStart(4, "0")}`;

    // Create new reservation
    const newReservation = reservationRepository.create({
      invoiceNumber: newInvoiceNumber,
      inProgress: true,
      isUsed: false,
      lastUsed: new Date(),
    });

    const saved = await reservationRepository.save(newReservation);
    // console.log(`Created new ${prefix} reservation:`, saved.invoiceNumber);
    return saved.invoiceNumber;
  }

  async markInvoiceNumberAsUsed(invoiceNumber) {
    const reservationRepo = AppDataSource.getRepository("InvoiceReservation");

    try {
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
        // console.log(`✅ Successfully marked as used:`, invoiceNumber);
        return true;
      } else {
        // console.log(`⚠️ Invoice not found:`, invoiceNumber);
        return false;
      }
    } catch (error) {
      console.error("Error marking invoice as used:", error);
      throw error;
    }
  }
  async getAllBills(filters = {}) {
    try {
      const billRepository = AppDataSource.getRepository("SalesBill");
      const queryBuilder = billRepository
        .createQueryBuilder("bill")
        .leftJoinAndSelect("bill.customer", "customer")
        .orderBy("bill.invoiceNumber", "ASC");

      if (filters.customerName) {
        queryBuilder.andWhere("customer.fullName ILIKE :customerName", {
          customerName: `%${filters.customerName}%`,
        });
      }

      // isTaxable filter
      if (filters.isTaxable !== undefined) {
        if (filters.isTaxable === "true") {
          queryBuilder.andWhere("bill.taxableTotal > 0");
        } else if (filters.isTaxable === "false") {
          queryBuilder.andWhere("bill.taxableTotal = 0");
        }
      }

      // Total amount range filter
      if (filters.minTotal && !isNaN(filters.minTotal)) {
        queryBuilder.andWhere("bill.grandTotal >= :minTotal", {
          minTotal: Number(filters.minTotal),
        });
      }

      if (filters.maxTotal && !isNaN(filters.maxTotal)) {
        queryBuilder.andWhere("bill.grandTotal <= :maxTotal", {
          maxTotal: Number(filters.maxTotal),
        });
      }

      const page = parseInt(filters.page) || 1;
      const limit = parseInt(filters.limit) || 10;
      const skip = (page - 1) * limit;

      queryBuilder.skip(skip).take(limit);

      const bills = await queryBuilder.getMany();

      // Count query
      const countQueryBuilder = billRepository
        .createQueryBuilder("bill")
        .leftJoin("bill.customer", "customer") // JOIN for count
        .select("COUNT(bill.id)", "count");

      if (filters.customerName) {
        countQueryBuilder.andWhere("customer.fullName ILIKE :customerName", {
          customerName: `%${filters.customerName}%`,
        });
      }

      if (filters.isTaxable !== undefined) {
        if (filters.isTaxable === "true") {
          countQueryBuilder.andWhere("bill.taxableTotal > 0");
        } else if (filters.isTaxable === "false") {
          countQueryBuilder.andWhere("bill.taxableTotal = 0");
        }
      }

      if (filters.minTotal && !isNaN(filters.minTotal)) {
        countQueryBuilder.andWhere("bill.grandTotal >= :minTotal", {
          minTotal: Number(filters.minTotal),
        });
      }

      if (filters.maxTotal && !isNaN(filters.maxTotal)) {
        countQueryBuilder.andWhere("bill.grandTotal <= :maxTotal", {
          maxTotal: Number(filters.maxTotal),
        });
      }

      const countResult = await countQueryBuilder.getRawOne();
      const totalCount = parseInt(countResult.count);
      const totalPages = Math.ceil(totalCount / limit);

      return {
        result: bills,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      throw error;
    }
  }
  async getBillWithDetails(invoiceNumber) {
    try {
      const billRepository = AppDataSource.getRepository("SalesBill");
      const bill = await billRepository
        .createQueryBuilder("bill")
        .leftJoinAndSelect("bill.items", "items")
        .leftJoinAndSelect("items.product", "product")
        .where("bill.invoiceNumber = :invoiceNumber", { invoiceNumber })
        .getOne();
      if (!bill) {
        throw new Error(`bill with invoice number ${invoiceNumber} not found.`);
      }
      return bill;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new BillService();
