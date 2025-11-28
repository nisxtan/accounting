const billRouter = require("express").Router();
const billController = require("../controllers/bill.controller");
// const BillController = require("../controllers/bill.controller");

//! bill routes

billRouter.get("/invoice", billController.getNewInvoiceNumber);

//create the bill
billRouter.post("/", billController.createBill);

//get all bills
billRouter.get("/", billController.getAllBills);
module.exports = billRouter;
