const billRouter = require("express").Router();
const billController = require("../controllers/bill.controller");
const authMiddleware = require("../middleware/auth.middleware");

billRouter.get("/invoice", authMiddleware, billController.getNewInvoiceNumber);
billRouter.get(
  "/details/:invoiceNumber",
  authMiddleware,
  billController.getBillDetails
);
billRouter.post("/", authMiddleware, billController.createBill);
billRouter.get("/", authMiddleware, billController.getAllBills);

module.exports = billRouter;
