import axiosInstance from "./axios";

const productService = {
  // GET ALL PRODUCTS
  getAll: async () => {
    try {
      const response = await axiosInstance.get("/product");
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // GET PRODUCT BY ID
  getById: async (id) => {
    try {
      const response = await axiosInstance.get(`/product/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // CHECK STOCK AVAILABILITY
  checkStock: async (productId, requiredQuantity) => {
    try {
      const response = await axiosInstance.post("/products/check-stock", {
        productId,
        quantity: requiredQuantity,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // CREATE PRODUCT
  create: async (productData) => {
    try {
      const response = await axiosInstance.post("/product", productData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default productService;
