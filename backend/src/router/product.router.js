const express = require("express");
const productRouter = express.Router();
const ProductController = require("../controllers/product.controller");

// GET ALL PRODUCTS
productRouter.get("/", ProductController.getProducts);

// GET PRODUCT BY ID
productRouter.get("/:id", ProductController.getProductById);

// CHECK STOCK
productRouter.post("/check-stock", ProductController.checkStock);

// CREATE PRODUCT (pachi use garne)
productRouter.post("/", ProductController.createProduct);

module.exports = productRouter;
