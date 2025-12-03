import axiosInstance from "./axios";

const billService = {
  // CREATE NEW BILL
  create: async (billData) => {
    try {
      const response = await axiosInstance.post("/bill", billData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // GET BILL BY ID
  getById: async (id) => {
    try {
      const response = await axiosInstance.get(`/bill/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getNewInvoiceNumber() {
    return axiosInstance.get("/bill/invoice");
  },

  async getAllBills(filters = {}, pagination = {}) {
    try {
      const queryParams = new URLSearchParams();

      if (filters.customerName)
        queryParams.append("customerName", filters.customerName);
      if (filters.isTaxable) queryParams.append("isTaxable", filters.isTaxable);
      if (filters.minTotal) queryParams.append("minTotal", filters.minTotal);
      if (filters.maxTotal) queryParams.append("maxTotal", filters.maxTotal);
      //add pagination
      const page = pagination.page || 1;
      const limit = pagination.limit || 5;

      queryParams.append("page", page);
      queryParams.append("limit", limit);
      const response = await axiosInstance.get(`/bill?${queryParams}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  getBillDetails: async (invoiceNumber) => {
    try {
      const response = await axiosInstance.get(
        `/bill/details/${invoiceNumber}`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default billService;
