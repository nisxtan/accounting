const ProductService = require("../services/product.service");

class ProductController {
  // GET ALL PRODUCTS
  async getProducts(req, res) {
    try {
      const products = await ProductService.getAllProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // GET PRODUCT BY ID
  async getProductById(req, res) {
    try {
      const product = await ProductService.getProductById(req.params.id);
      res.json(product);
    } catch (error) {
      if (error.message.includes("not found")) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  }

  // CHECK STOCK
  async checkStock(req, res) {
    try {
      const { productId, requiredQuantity } = req.body;
      const hasStock = await ProductService.checkStock(
        productId,
        requiredQuantity
      );
      res.json({ hasStock });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // CREATE PRODUCT
  async createProduct(req, res) {
    try {
      const savedProduct = await ProductService.createProduct(req.body);

      res.status(201).json({
        message: "Product created successfully",
        product: savedProduct,
      });
    } catch (error) {
      console.error("Error creating product:", error);

      // Handle validation errors
      if (
        error.message.includes("required") ||
        error.message.includes("already exists")
      ) {
        return res.status(400).json({
          message: error.message,
        });
      }

      // Handle unique constraint violation at database level
      if (error.code === "23505" || error.code === "ER_DUP_ENTRY") {
        return res.status(409).json({
          message: "Product with this name already exists",
        });
      }

      // Generic server error
      res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  }
}

module.exports = new ProductController();
