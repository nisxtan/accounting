const express = require("express");
const returnRouter = express.Router();
const ReturnController = require("../controllers/return.controller");
const authenticate = require("../middleware/auth.middleware");

// Apply authentication to all routes
returnRouter.use(authenticate);

// Generate new return number (RET-XXXX)
returnRouter.get("/new-return-number", ReturnController.getNewReturnNumber);

// Get invoice details for return (with items)
returnRouter.get(
  "/invoice/:invoiceNumber",
  ReturnController.getInvoiceForReturn
);

// Create a new return
returnRouter.post("/", ReturnController.createNewReturn);

returnRouter.get("/", ReturnController.getAllReturns);

// Get return by ID
returnRouter.get("/:id", ReturnController.getReturnById);

// Approve a return (updates stock, marks as approved)
returnRouter.put("/:id/approve", ReturnController.approveReturn);

// Reject a return
returnRouter.put("/:id/reject", ReturnController.rejectReturn);

// Update return status (general endpoint - can approve/reject)
returnRouter.put("/:id/status", ReturnController.updateReturnStatus);

// Get all returns for a specific invoice
returnRouter.get(
  "/invoice/:invoiceNumber/returns",
  ReturnController.getReturnsByInvoice
);

module.exports = returnRouter;
