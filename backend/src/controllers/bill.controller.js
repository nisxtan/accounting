const billService = require("../services/bill.service");
const salesItemService = require("../services/salesItem.service");

class BillController {
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
