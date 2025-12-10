const { useId } = require("react");
const returnService = require("../services/return.service");
class ReturnController {
  // get new return number
  async getNewReturnNumber(req, res) {
    try {
      const returnNumber = await returnService.generateReturnNumber();
      res.json({ returnNumber });
    } catch (error) {
      console.error("Error generating return number", error);
      res.status(500).json({
        error: error.message,
        message: "Failed to generate return number",
      });
    }
  }

  //get invoice details for return
  async getInvoiceForReturn(req, res) {
    try {
      const { invoiceNumber } = req.params;
      if (!invoiceNumber) {
        return res.status(400).json({
          error: "Invoice number is required",
        });
      }
      const invoiceData = await returnService.getInvoiceForReturn(
        invoiceNumber
      );
      res.json(invoiceData);
    } catch (error) {
      res.status(400).json({
        error: error.message,
        message: "Failed to get invoice details",
      });
    }
  }

  //create a new return
  async createNewReturn(req, res) {
    try {
      const returnData = req.body;
      const userId = req.user?.userId || req.user?.id;
      if (!userId) {
        return res.status(401).json({
          error: "User authentication required",
        });
      }
      //validate required fields
      if (!returnData.invoiceNumber) {
        return res.status(400).json({
          error: "Invoice number is required",
        });
      }

      if (
        !returnData.items ||
        !Array.isArray(returnData.items) ||
        returnData.items.length === 0
      ) {
        return res.status(400).json({
          error: "At lease one item is required for return",
        });
      }

      const savedReturn = await returnService.createReturn(returnData, useId);

      res.status(201).json({
        message: "Return created successfully",
        return: savedReturn,
      });
    } catch (error) {
      console.error("Error creating return", error);
      res.status(400).json({
        error: error.message,
        message: "Failed to create return ",
      });
    }
  }

  //get all returns
  async getAllReturns(req, res) {
    try {
      const {
        invoiceNumber,
        customerId,
        status,
        startDate,
        endDate,
        page = 1,
        limit = 10,
      } = req.query;

      const filters = {
        invoiceNumber,
        customerId,
        status,
        startDate,
        endDate,
        page: parseInt(page),
        limit: parseInt(limit),
      };

      const result = await returnService.getAllReturns(filters);
      res.json(result);
    } catch (error) {
      console.error("Error getting all returns", error);
      res.status(500).json({
        error: error.message,
        message: "Failed to get returns",
      });
    }
  }

  //get return by id
  async getReturnById(req, res) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({
          error: "Return ID is required",
        });
      }

      const returnRecord = await returnService.getReturnById(id);
      res.json(returnRecord);
    } catch (error) {
      console.error("Error getting return by ID:", error);
      res.status(404).json({
        error: error.message,
        message: "Return not found",
      });
    }
  }

  //approve return
  async approveReturn(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId || req.user?.id;
      if (!id) {
        return res.status(400).json({
          error: "Return id is required",
        });
      }
      if (!userId) {
        return res.status(400).json({
          error: "Return id is required",
        });
      }
      const approvedReturn = await returnService.approveReturn(id, userId);

      res.json({
        message: "Return approved successfully",
        return: approvedReturn,
      });
    } catch (error) {
      console.error("Error approving return:", error);
      res.status(400).json({
        error: error.message,
        message: "Failed to approve return",
      });
    }
  }

  //reject return
  async rejectReturn(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const userId = req.user?.userId || req.user?.id;

      if (!id) {
        return res.status(400).json({
          error: "Return ID is required",
        });
      }

      if (!userId) {
        return res.status(401).json({
          error: "User authentication required",
        });
      }

      const rejectedReturn = await ReturnService.rejectReturn(
        id,
        reason,
        userId
      );

      res.json({
        message: "Return rejected successfully",
        return: rejectedReturn,
      });
    } catch (error) {
      console.error("Error rejecting return:", error);
      res.status(400).json({
        error: error.message,
        message: "Failed to reject return",
      });
    }
  }

  //get returns by invoice number
  async getReturnsByInvoice(req, res) {
    try {
      const { invoiceNumber } = req.params;
      if (!invoiceNumber) {
        return res.status(4400).json({
          error: "Invoice number is required",
        });
      }
      const returns = await returnService.getReturnsByInvoice(invoiceNumber);
      res.json(returns);
    } catch (error) {
      res.status(500).json({
        error: error.message,
        message: "Failed to get returns for invoice",
      });
    }
  }

  //update return status
  async updateReturnStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;
      const userId = req.user?.userId || req.user?.id;

      if (!id) {
        return res.status(400).json({
          error: "Return ID is required",
        });
      }
      if (!userId) {
        return res.status(401).json({
          error: "User authentication required",
        });
      }
      if (!status) {
        return res.status(400).json({
          error: "Status is required",
        });
      }

      let result;
      if (status === "approved") {
        result = await returnService.approveReturn(id, userId);
      } else if (status === "rejected") {
        result = await returnService.rejectReturn(id, userId);
      } else if (status === "completed") {
        return res.status(400).json({ error: "Status not implemented yet" });
      } else {
        return res.status(400).json({ error: "Invalid status value" });
      }
      res.json({
        message: `Return ${status} successfully`,
        return: result,
      });
    } catch (error) {
      console.error("Error updating return status", error);
      res.status(400).json({
        error: error.message,
        message: "Failed to update return status",
      });
    }
  }
}

module.exports = new ReturnController();
