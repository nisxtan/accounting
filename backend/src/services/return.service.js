const { In } = require("typeorm");
const { AppDataSource } = require("../config/database");

const billService = require("./bill.service");

class ReturnService {
  async generateReturnNumber() {
    return await billService.generateInvoiceNumber("RET");
  }

  async getInvoiceForReturn(invoiceNumber) {
    const billRepository = AppDataSource.getRepository("SalesBill");

    const bill = await billRepository
      .createQueryBuilder("bill")
      .leftJoinAndSelect("bill.items", "items")
      .leftJoinAndSelect("items.product", "product")
      .leftJoinAndSelect("bill.customer", "customer")
      .where("bill.invoiceNumber = :invoiceNumber", { invoiceNumber })
      .getOne();

    if (!bill) {
      throw new Error(`Invoice ${invoiceNumber} not found`);
    }

    const returnRepository = AppDataSource.getRepository("Return");
    const approvedReturns = await returnRepository.find({
      where: {
        originalInvoiceNumber: invoiceNumber,
        status: In(["approved", "pending"]),
      },
    });

    const returnedQuantities = {};
    let totalRefunded = 0;

    for (const returnRecord of approvedReturns) {
      const returnItems = await AppDataSource.getRepository("ReturnItem").find({
        where: { returnId: returnRecord.id },
      });

      for (const returnItem of returnItems) {
        const salesItemId =
          returnItem.originalSalesItemId || returnItem.originalSalesItemid;
        if (salesItemId) {
          returnedQuantities[salesItemId] =
            (returnedQuantities[salesItemId] || 0) +
            returnItem.returnedQuantity;
          totalRefunded += returnItem.refundAmount;
        }
      }
    }

    const items = bill.items.map((item) => {
      const alreadyReturned = returnedQuantities[item.id] || 0;
      const availableToReturn = item.quantity - alreadyReturned;

      return {
        id: item.id,
        productId: item.product.id,
        productName: item.product.name,
        originalQuantity: item.quantity,
        alreadyReturned: alreadyReturned,
        availableToReturn: availableToReturn,
        unit: item.unit,
        rate: item.rate,
        originalTotal: item.total,
        isTaxable: item.isTaxable,
        returnedQuantity: 0,
        refundRate: item.rate,
        reason: "",
        maxQuantity: availableToReturn,
        canReturn: availableToReturn > 0,
        isFullyReturned: alreadyReturned >= item.quantity,
      };
    });

    const canReturnAny = items.some((item) => item.canReturn);
    const isFullyReturned = items.every((item) => item.isFullyReturned);

    return {
      invoiceNumber: bill.invoiceNumber,
      salesDate: bill.salesDate,
      customer: {
        id: bill.customer.id,
        name: bill.customer.fullName || bill.customer.name,
      },
      items: items,
      canReturn: canReturnAny,
      isFullyReturned: isFullyReturned,
      summary: {
        totalSold: bill.items.reduce((sum, item) => sum + item.quantity, 0),
        totalReturned: Object.values(returnedQuantities).reduce(
          (sum, qty) => sum + qty,
          0
        ),
        totalRefunded: totalRefunded,
        pendingReturn: items.reduce(
          (sum, item) => sum + item.availableToReturn,
          0
        ),
      },
    };
  }

  async createReturn(returnData, userId) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const { invoiceNumber, items, reason } = returnData;

      const validItems = items.filter(
        (item) => item.returnedQuantity && item.returnedQuantity > 0
      );
      // console.log("Valid items", validItems);
      if (validItems.length === 0) {
        throw new Error("Please return at least one quantity of any product.");
      }

      const billRepository = queryRunner.manager.getRepository("SalesBill");
      const bill = await billRepository
        .createQueryBuilder("bill")
        .leftJoinAndSelect("bill.customer", "customer")
        .where("bill.invoiceNumber = :invoiceNumber", { invoiceNumber })
        .getOne();
      if (!bill) {
        throw new Error(`Invoice ${invoiceNumber} does not exist`);
      }

      const returnNumber = await this.generateReturnNumber();

      const returnRepository = queryRunner.manager.getRepository("Return");
      const returnRecord = returnRepository.create({
        returnNumber,
        returnDate: new Date(),
        originalInvoiceNumber: invoiceNumber,
        billId: bill.id,
        customerId: bill.customer.id,
        userId: userId,
        reason: reason || null,
        status: "pending",
        totalRefundAmount: 0,
      });
      const savedReturn = await returnRepository.save(returnRecord);

      let totalRefund = 0;
      const returnItemRepository =
        queryRunner.manager.getRepository("ReturnItem");

      for (const itemData of validItems) {
        const {
          originalSalesItemId,
          returnedQuantity,
          refundRate,
          reason: itemReason,
        } = itemData;

        const salesItemRepo = queryRunner.manager.getRepository("SalesItem");
        const salesItem = await salesItemRepo.findOne({
          where: { id: originalSalesItemId },
          relations: ["product", "bill"],
        });
        if (!salesItem) {
          throw new Error(`Sales item ${originalSalesItemId} not found`);
        }

        if (salesItem.bill.invoiceNumber !== invoiceNumber) {
          throw new Error(`Item does not belong to invoice ${invoiceNumber}`);
        }

        const existingReturnItems = await returnItemRepository
          .createQueryBuilder("ri")
          .leftJoin("ri.return", "r")
          .where("ri.originalSalesItemid = :salesItemId", {
            salesItemId: originalSalesItemId,
          })
          .andWhere("r.originalInvoiceNumber = :invoiceNumber", {
            invoiceNumber: invoiceNumber,
          })
          .andWhere("r.status = :status", { status: "approved" })
          .select("SUM(ri.returnedQuantity)", "totalReturned")
          .getRawOne();

        const alreadyReturned =
          parseFloat(existingReturnItems?.totalReturned) || 0;
        const maxCanReturn = salesItem.quantity - alreadyReturned;

        if (returnedQuantity > maxCanReturn) {
          throw new Error(
            `Cannot return ${returnedQuantity} of "${salesItem.product?.name}". ` +
              `Max available: ${maxCanReturn} (Already returned: ${alreadyReturned})`
          );
        }

        const finalRefundRate = refundRate || salesItem.rate;
        const refundAmount = returnedQuantity * finalRefundRate;
        totalRefund += refundAmount;

        const returnItem = returnItemRepository.create({
          returnId: savedReturn.id,
          productId: salesItem.productId,
          originalSalesItemid: originalSalesItemId,
          originalQuantity: salesItem.quantity,
          returnedQuantity,
          unit: salesItem.unit,
          originalRate: salesItem.rate,
          returnedRate: finalRefundRate,
          isTaxable: salesItem.isTaxable,
          reason: itemReason || null,
        });

        await returnItemRepository.save(returnItem);
      }

      savedReturn.totalRefundAmount = totalRefund;
      await returnRepository.save(savedReturn);

      await billService.markInvoiceNumberAsUsed(returnNumber);

      await queryRunner.commitTransaction();

      const completeReturn = await returnRepository.findOne({
        where: { id: savedReturn.id },
        relations: [
          "returnItems",
          "returnItems.product",
          "customer",
          "bill",
          "user",
        ],
      });

      return completeReturn;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error("Error creating return:", error.message);
      console.error("Stack trace:", error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async approveReturn(returnId, userId) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const returnRepository = queryRunner.manager.getRepository("Return");
      const returnRecord = await returnRepository.findOne({
        where: { id: returnId },
        relations: ["returnItems", "returnItems.product", "bill"],
      });
      if (!returnRecord) {
        throw new Error(`Return ${returnId} not found`);
      }
      if (returnRecord.status !== "pending") {
        throw new Error(
          `Cannot approve return. Current status: ${returnRecord.status}`
        );
      }

      const productRepository = queryRunner.manager.getRepository("Product");
      for (const returnItem of returnRecord.returnItems) {
        if (returnItem.returnedQuantity > 0) {
          await productRepository.increment(
            {
              id: returnItem.productId,
            },
            "quantity",
            returnItem.returnedQuantity
          );
          // console.log(
          //   ` Added ${returnItem.returnedQuantity} ${returnItem.unit} back to product ${returnItem.productId}`
          // );
        }
      }

      returnRecord.status = "approved";
      returnRecord.updatedAt = new Date();
      await returnRepository.save(returnRecord);

      const billRepository = queryRunner.manager.getRepository("SalesBill");
      await billRepository.increment(
        { id: returnRecord.billId },
        "returnedAmount",
        returnRecord.totalRefundAmount
      );

      const allBillItems = await queryRunner.manager
        .getRepository("SalesItem")
        .find({ where: { billId: returnRecord.billId } });

      const totalSold = allBillItems.reduce(
        (sum, item) => sum + item.quantity,
        0
      );

      const allReturns = await returnRepository.find({
        where: { billId: returnRecord.billId, status: "approved" },
      });
      let totalReturned = 0;
      for (const ret of allReturns) {
        const items = await queryRunner.manager
          .getRepository("ReturnItem")
          .find({ where: { returnId: ret.id } });
        totalReturned += items.reduce(
          (sum, item) => sum + item.returnedQuantity,
          0
        );
      }

      if (totalReturned >= totalSold) {
        await billRepository.update(
          { id: returnRecord.billId },
          { isFullyReturned: true }
        );
        // console.log(
        //   `bill ${returnRecord.originalInvoiceNumber} marked as fully returned`
        // );
      }
      await queryRunner.commitTransaction();
      return returnRecord;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getReturnById(returnId) {
    const returnRepository = AppDataSource.getRepository("Return");

    const returnRecord = await returnRepository
      .createQueryBuilder("return")
      .leftJoinAndSelect("return.returnItems", "returnItems")
      .leftJoinAndSelect("returnItems.product", "product")
      .leftJoinAndSelect("returnItems.originalSalesItem", "originalSalesItem")
      .leftJoinAndSelect("return.customer", "customer")
      .leftJoinAndSelect("return.user", "user")
      .where("return.id= :returnId", { returnId })
      .getOne();
    if (!returnRecord) {
      throw new Error(`Return ${returnId} not found`);
    }
    return returnRecord;
  }

  async rejectReturn(returnId, reason, userId) {
    const returnRepository = AppDataSource.getRepository("Return");

    const returnRecord = await returnRepository.findOne({
      where: { id: returnId },
    });

    if (!returnRecord) {
      throw new Error(`Return ${returnId} not found`);
    }

    if (returnRecord.status !== "pending") {
      throw new Error(
        `Cannot reject return. Current status: ${returnRecord.status}`
      );
    }

    returnRecord.status = "rejected";
    returnRecord.reason = reason || returnRecord.reason;
    returnRecord.updatedAt = new Date();

    return await returnRepository.save(returnRecord);
  }

  async getAllReturns(filters = {}) {
    const returnRepository = AppDataSource.getRepository("Return");
    const queryBuilder = returnRepository
      .createQueryBuilder("return")
      .leftJoinAndSelect("return.customer", "customer")
      .leftJoinAndSelect("return.bill", "bill")
      .leftJoinAndSelect("return.user", "user")
      .orderBy("return.createdAt", "DESC");

    if (filters.invoiceNumber) {
      queryBuilder.andWhere("return.originalInvoiceNumber = :invoiceNumber", {
        invoiceNumber: filters.invoiceNumber,
      });
    }

    if (filters.customerId) {
      queryBuilder.andWhere("return.customerId = :customerId", {
        customerId: filters.customerId,
      });
    }

    if (filters.status) {
      queryBuilder.andWhere("return.status = :status", {
        status: filters.status,
      });
    }

    if (filters.startDate) {
      queryBuilder.andWhere("return.returnDate >= :startDate", {
        startDate: filters.startDate,
      });
    }

    if (filters.endDate) {
      queryBuilder.andWhere("return.returnDate <= :endDate", {
        endDate: filters.endDate,
      });
    }

    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 10;
    const skip = (page - 1) * limit;

    queryBuilder.skip(skip).take(limit);

    const [returns, total] = await queryBuilder.getManyAndCount();

    return {
      returns,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  async getReturnsByInvoice(invoiceNumber) {
    const returnRepository = AppDataSource.getRepository("Return");

    const returns = await returnRepository
      .createQueryBuilder("return")
      .leftJoinAndSelect("return.returnItems", "returnItems")
      .leftJoinAndSelect("returnItems.product", "product")
      .where("return.originalInvoiceNumber = :invoiceNumber", { invoiceNumber })
      .orderBy("return.returnDate", "DESC")
      .getMany();

    return returns;
  }
}

module.exports = new ReturnService();
