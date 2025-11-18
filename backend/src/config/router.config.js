const billRouter = require("../router/bill.router");

const router = require("express").Router();

router.use("/bill", billRouter);
module.exports = router;
