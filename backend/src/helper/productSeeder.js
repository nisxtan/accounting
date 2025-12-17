const { AppDataSource } = require("../config/database");
const Product = require("../entity/Product");
const seedProducts = async () => {
  try {
    await AppDataSource.initialize();
    const productRepository = AppDataSource.getRepository(Product);

    const products = [
      {
        name: "Eggs",
        quantity: 100,
        isTaxable: true,
      },
      {
        name: "Milk",
        quantity: 50,
        isTaxable: true,
      },
      {
        name: "Bread",
        quantity: 30,
        isTaxable: true,
      },
      {
        name: "Rice",
        quantity: 40,
        isTaxable: true,
      },
      {
        name: "Cooking Oil",
        quantity: 25,
        isTaxable: true,
      },
      {
        name: "Sugar",
        quantity: 60,
        isTaxable: true,
      },
      {
        name: "Salt",
        quantity: 45,
        isTaxable: false,
      },
      {
        name: "Flour",
        quantity: 35,
        isTaxable: true,
      },
      {
        name: "Butter",
        quantity: 20,
        isTaxable: true,
      },
      {
        name: "Cheese",
        quantity: 15,
        isTaxable: true,
      },
      {
        name: "Yogurt",
        quantity: 25,
        isTaxable: true,
      },
      {
        name: "Potatoes",
        quantity: 40,
        isTaxable: false,
      },
      {
        name: "Tomatoes",
        quantity: 30,
        isTaxable: false,
      },
      {
        name: "Onions",
        quantity: 35,
        isTaxable: false,
      },
      {
        name: "Chicken",
        quantity: 20,
        isTaxable: true,
      },
    ];

    await productRepository.save(products);
    // console.log("Products seeded successfully");
    await AppDataSource.destroy();
  } catch (error) {
    console.error("Error seeding products.", error);
  }
};

if (require.main === module) {
  seedProducts();
}

module.exports = seedProducts;
