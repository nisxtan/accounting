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

  // GET ALL BILLS
  // getAll: async () => {
  //   try {
  //     const response = await axiosInstance.get("/bill");
  //     return response.data;
  //   } catch (error) {
  //     throw error.response?.data || error.message;
  //   }
  // },
  getNewInvoiceNumber() {
    return axiosInstance.get("/bill/invoice");
  },

  async getAllBills(filters = {}) {
    try {
      const queryParams = new URLSearchParams();

      if (filters.customerName)
        queryParams.append("customerName", filters.customerName);
      if (filters.isTaxable) queryParams.append("isTaxable", filters.isTaxable);
      if (filters.minTotal) queryParams.append("minTotal", filters.minTotal);
      if (filters.maxTotal) queryParams.append("maxTotal", filters.maxTotal);

      const response = await axiosInstance.get(`/bill?${queryParams}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }

    // add all filters to query strings
  },
};

export default billService;
