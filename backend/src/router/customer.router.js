const customerRouter = require("express").Router();
const customerController = require("../controllers/customer.controller");
const authMiddleware = require("../middleware/auth.middleware");

customerRouter.use(authMiddleware);

customerRouter.post("/", customerController.createCustomer);
customerRouter.get("/", customerController.getAllCustomers);
customerRouter.get("/search", customerController.searchCustomers);
customerRouter.get("/:id", customerController.getCustomer);
customerRouter.put("/:id", customerController.updateCustomer);
customerRouter.delete("/:id", customerController.deleteCustomer);

module.exports = customerRouter;
