const billRouter = require("express").Router();
const billController = require("../controllers/bill.controller");
const BillController = require("../controllers/bill.controller");

//! bill routes

//create the bill
billRouter.post("/", billController.createBill);

module.exports = billRouter;
