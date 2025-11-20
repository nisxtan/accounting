import axiosInstance from "./axiosConfig";

export const billApi = {
  // Create new bill
  createBill: async (billData) => {
    const response = await axiosInstance.post("/bill", billData);
    return response.data;
  },

  // Get bill by ID
  getBillById: async (id) => {
    const response = await axiosInstance.get(`/bill/${id}`);
    return response.data;
  },

  // Get all bills
  getAllBills: async () => {
    const response = await axiosInstance.get("/bill");
    return response.data;
  },
};
