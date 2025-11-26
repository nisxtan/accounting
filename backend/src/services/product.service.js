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

  // CREATE NEW PRODUCT
  async createProduct(productData) {
    const { name, quantity, baseRate, isTaxable } = productData;

    // Validation
    if (!name || name.trim() === "") {
      throw new Error("Product name is required");
    }

    if (quantity === undefined || quantity === null || quantity < 0) {
      throw new Error("Valid quantity is required");
    }

    if (baseRate === undefined || baseRate === null || baseRate < 0) {
      throw new Error("Valid base rate is required");
    }

    const productRepository = AppDataSource.getRepository(Product);

    // Check if product with same name already exists (case-insensitive)
    const existingProduct = await productRepository
      .createQueryBuilder("product")
      .where("LOWER(product.name) = LOWER(:name)", { name: name.trim() })
      .getOne();

    if (existingProduct) {
      throw new Error("Product with this name already exists");
    }

    // Create new product
    const product = productRepository.create({
      name: name.trim(),
      quantity: parseInt(quantity),
      baseRate: parseFloat(baseRate),
      isTaxable: isTaxable !== undefined ? isTaxable : true,
    });

    // Save to database
    const savedProduct = await productRepository.save(product);
    return savedProduct;
  }
}

module.exports = new ProductService();
