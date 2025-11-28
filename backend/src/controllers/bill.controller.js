const billService = require("../services/bill.service");
const salesItemService = require("../services/salesItem.service");

class BillController {
  //
  // async createBill(req, res, next) {
  //   try {
  //     //test
  //     res.status(200).json({
  //       message: "Bill creation endpoint",
  //     });
  //   } catch (error) {
  //     next(error);
  //   }
  // }
  // async testSaleItemService(req, res) {
  //   try {
  //     const test1 = salesItemService.getBaseQuantity(2, "dozen");
  //     const test2 = salesItemService.getBaseQuantity(50, "pcs");
  //     res.status(200).json({
  //       message: "Bill service is working",
  //     });
  //   } catch (error) {}
  // }
  // async testRowCalculation(req, res) {
  //   try {
  //     const testItem = {
  //       quantity: 2,
  //       unit: "dozen",
  //       rate: 50,
  //       discountPercent: 10,
  //       isTaxable: false,
  //     };
  //     const result = salesItemService.calculateRowTotal(testItem);
  //     res.json({
  //       input: testItem,
  //       calculation: result,
  //     });
  //   } catch (error) {
  //     res.status(500).json({ error: error.message });
  //   }
  // }\

  async getNewInvoiceNumber(req, res) {
    try {
      const invoiceNumber = await billService.generateInvoiceNumber();
      res.json({ invoiceNumber });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async createBill(req, res, next) {
    try {
      const billData = req.body;
      const savedBill = await billService.createCompleteBill(billData);

      res.status(201).json({
        message: "Bill created successfully",
        bill: savedBill,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllBills(req, res, next) {
    try {
      const { customerName, isTaxable, minTotal, maxTotal, page, limit } =
        req.query;
      const result = await billService.getAllBills({
        customerName,
        isTaxable,
        minTotal,
        maxTotal,
        page: page,
        limit: limit,
      });
      // console.log(bills);
      res.json({
        result: result.bills,
        pagination: result.pagination,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new BillController();
