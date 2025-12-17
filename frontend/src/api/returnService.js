import axiosInstance from "./axios";

const returnService = {
  getNewReturnNumber: async () => {
    // console.log("Entered gert New Return Number");
    const response = await axiosInstance.get("/return/new-return-number");
    console.log("Return number from return.service.js", response);
    return response.data;
  },

  getInvoiceForReturn: async (invoiceNumber) => {
    const response = await axiosInstance.get(
      `/return/invoice/${invoiceNumber}`
    );
    return response.data;
  },

  createReturn: async (returnData) => {
    const response = await axiosInstance.post("/return", returnData);
    return response.data;
  },

  getAllReturns: async (filters = {}) => {
    const response = await axiosInstance.get("/return", { params: filters });
    return response.data;
  },

  approveReturn: async (returnId) => {
    const response = await axiosInstance.put(`/return/${returnId}/approve`);
    return response.data;
  },

  rejectReturn: async (returnId) => {
    const response = await axiosInstance.put(`return/${returnId}/reject`, {
      reason,
    });
    return response.data;
  },
};

export default returnService;
