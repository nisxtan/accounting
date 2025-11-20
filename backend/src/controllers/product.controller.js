const productService = require("../services/product.service");

class ProductController {
  // GET ALL PRODUCTS
  async getProducts(req, res) {
    try {
      const products = await productService.getAllProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // GET PRODUCT BY ID
  async getProductById(req, res) {
    try {
      const { id } = req.params;
      const product = await productService.getProductById(parseInt(id));
      res.json(product);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  // CHECK STOCK
  async checkStock(req, res) {
    try {
      const { productId, quantity } = req.body;
      const hasStock = await productService.checkStock(productId, quantity);
      res.json({ hasStock });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // CREATE PRODUCT
  async createProduct(req, res) {
    try {
      const productRepository = AppDataSource.getRepository("Product");
      const product = productRepository.create(req.body);
      const savedProduct = await productRepository.save(product);
      res.status(201).json(savedProduct);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new ProductController();
