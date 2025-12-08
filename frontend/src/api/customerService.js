import axiosInstance from "./axios";

const customerService = {
  createCustomer: async (customerData) => {
    try {
      const response = await axiosInstance.post("/customer", customerData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: "Failed to create customer" };
    }
  },
  getAllCustomers: async (filters = {}) => {
    try {
      const params = {
        search: filters.search || "",
        status: filters.status,
        page: filters.page,
        limit: filters.limit,
      };
      const response = await axiosInstance.get("/customer", { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: "Failed to fetch customers" };
    }
  },

  getCustomerById: async (id) => {
    try {
      const response = await axiosInstance.get(`/customer/${id}`);
      return response.data.customer;
    } catch (error) {
      throw error.response?.data || { error: "Failed to fetch customer" };
    }
  },

  updateCustomer: async (id, customerData) => {
    try {
      const response = await axiosInstance.put(`/customer/${id}`, customerData);
      return response.data.customer;
    } catch (error) {
      throw error.response?.data || { error: "Failed to update customer" };
    }
  },
  deleteCustomer: async (id) => {
    try {
      const response = await axiosInstance.delete(`/customer/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: "Failed to delete customer" };
    }
  },
  searchCustomers: async (query, limit = 10) => {
    try {
      const params = { q: query, limit };
      const response = await axiosInstance.get("/customers/search", { params });
      return response.data.customers;
    } catch (error) {
      throw error.response?.data || { error: "Customer search failed" };
    }
  },
};

export default customerService;
