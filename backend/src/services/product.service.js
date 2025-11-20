const { AppDataSource } = require("../config/database");
const Product = require("../entity/Product");

class ProductService {
  // GET ALL PRODUCTS
  async getAllProducts() {
    const productRepository = AppDataSource.getRepository(Product);
    return await productRepository.find();
  }

  // GET PRODUCT BY ID
  async getProductById(id) {
    const productRepository = AppDataSource.getRepository(Product);
    const product = await productRepository.findOne({ where: { id } });

    if (!product) {
      throw new Error(`Product with ID ${id} not found`);
    }

    return product;
  }

  // CHECK STOCK AVAILABILITY
  async checkStock(productId, requiredQuantity) {
    const product = await this.getProductById(productId);
    return product.quantity >= requiredQuantity;
  }

  // UPDATE PRODUCT QUANTITY
  async updateQuantity(productId, newQuantity) {
    const productRepository = AppDataSource.getRepository(Product);
    await productRepository.update(
      { id: productId },
      { quantity: newQuantity }
    );
    return await this.getProductById(productId);
  }
}

module.exports = new ProductService();
