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
  getAll: async () => {
    try {
      const response = await axiosInstance.get("/bill");
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  getNewInvoiceNumber() {
    return axiosInstance.get("/bill/invoice");
  },
};

export default billService;
