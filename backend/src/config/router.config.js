const billRouter = require("../router/bill.router");
const productRouter = require("../router/product.router");

const router = require("express").Router();

router.use("/bill", billRouter);
router.use("/product", productRouter);
module.exports = router;
