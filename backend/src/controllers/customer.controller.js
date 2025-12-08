const customerService = require("../services/customer.service");

class CustomerController {
  async createCustomer(req, res) {
    try {
      const { fullName, email, phone, address } = req.body;

      if (!fullName || fullName.trim() === "") {
        return res.status(400).json({ error: "Customer name is required" });
      }

      const userId = req.user?.userId || req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      console.log("Creating customer with userId:", userId); // Debug log

      const customer = await customerService.createCustomer(
        {
          fullName: fullName.trim(),
          email: email?.trim(),
          phone: phone?.trim(),
          address: address?.trim(),
          status: true,
        },
        userId
      );

      res.status(201).json({
        message: "Customer created successfully",
        customer,
      });
    } catch (error) {
      console.error("Create customer error:", error);
      res.status(400).json({ error: error.message });
    }
  }

  async getAllCustomers(req, res) {
    try {
      const filters = {
        search: req.query.search,
        status: req.query.status,
        page: req.query.page,
        limit: req.query.limit,
      };

      const result = await customerService.getAllCustomers(filters);

      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getCustomer(req, res) {
    try {
      const { id } = req.params;
      const customer = await customerService.getCustomerById(id);
      res.json({ customer });
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  async updateCustomer(req, res) {
    try {
      const { id } = req.params;
      const customerData = req.body;
      const customer = await customerService.updateCustomer(id, customerData);

      res.json({
        message: "Customer updated successfully",
        customer,
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteCustomer(req, res) {
    try {
      const { id } = req.params;
      await customerService.deleteCustomer(id);

      res.json({
        message: "Customer deleted successfully",
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async searchCustomers(req, res) {
    try {
      const { q } = req.query;
      const limit = req.query.limit || 10;

      if (!q || q.trim() === "") {
        return res.json({ customers: [] });
      }

      const customers = await customerService.searchCustomers(q.trim(), limit);
      res.json({ customers });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new CustomerController();
