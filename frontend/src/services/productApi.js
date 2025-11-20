import axiosInstance from "../api/axios";

export const productService = {
  // Get all products for dropdown
  getAll: async () => {
    const response = await axiosInstance.get("/product");
    return response.data;
  },

  // Get product by ID
  getProductById: async (id) => {
    const response = await axiosInstance.get(`/product/${id}`);
    return response.data;
  },
};
