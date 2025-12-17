const { AppDataSource } = require("../config/database");
const Product = require("../entity/Product");

const updateProductRates = async () => {
  try {
    await AppDataSource.initialize();
    const productRepository = AppDataSource.getRepository(Product);

    // Product rates (price per piece)
    const productRates = {
      Eggs: 4.16,
      Milk: 60,
      Bread: 25,
      Rice: 80,
      "Cooking Oil": 180,
      Sugar: 45,
      Salt: 20,
      Flour: 40,
      Butter: 120,
      Cheese: 200,
      Yogurt: 30,
      Potatoes: 25,
      Tomatoes: 30,
      Onions: 20,
      Chicken: 150,
    };

    // console.log("Updating product rates...");

    // Get all existing products
    const existingProducts = await productRepository.find();

    // Update each product with its rate
    for (const product of existingProducts) {
      if (productRates[product.name]) {
        product.baseRate = productRates[product.name];
        await productRepository.save(product);
        // console.log(`Updated ${product.name}: ${product.baseRate}`);
      }
    }

    // console.log("All product rates updated successfully!");
    await AppDataSource.destroy();
  } catch (error) {
    console.error("Error updating product rates:", error);
  }
};

// Run the updater
if (require.main === module) {
  updateProductRates();
}

module.exports = updateProductRates;
