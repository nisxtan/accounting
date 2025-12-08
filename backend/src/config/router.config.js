const billRouter = require("../router/bill.router");
const productRouter = require("../router/product.router");
const authRouter = require("../router/auth.router");
const customerRouter = require("../router/customer.router");
const router = require("express").Router();

router.use("/bill", billRouter);
router.use("/product", productRouter);
router.use("/auth", authRouter);
router.use("/customer", customerRouter);
module.exports = router;
