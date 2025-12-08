const { AppDataSource } = require("../config/database");

class CustomerService {
  async createCustomer(customerData, createdById = null) {
    const customerRepository = AppDataSource.getRepository("Customer");
    const userRepository = AppDataSource.getRepository("User");

    // Check for existing customer
    if (customerData.email || customerData.phone) {
      const existingUser = await customerRepository.findOne({
        where: [
          ...(customerData.email ? [{ email: customerData.email }] : []),
          ...(customerData.phone ? [{ phone: customerData.phone }] : []),
        ],
      });

      if (existingUser) {
        throw new Error("Customer with this email or phone already exists");
      }
    }

    //  Find and link the user if createdById is provided
    let createdByUser = null;
    if (createdById) {
      createdByUser = await userRepository.findOne({
        where: { id: createdById },
      });

      if (!createdByUser) {
        console.warn(`User with id ${createdById} not found`);
      }
    }

    //  Create customer with proper relation
    const customer = customerRepository.create({
      ...customerData,
      createdBy: createdByUser, // Use the user object, not just the ID
    });

    const savedCustomer = await customerRepository.save(customer);

    // Return customer with createdBy relation loaded
    return await customerRepository.findOne({
      where: { id: savedCustomer.id },
      relations: ["createdBy"],
    });
  }

  async getAllCustomers(filters = {}) {
    const customerRepository = AppDataSource.getRepository("Customer");
    const queryBuilder = customerRepository
      .createQueryBuilder("customer")
      .leftJoinAndSelect("customer.createdBy", "user"); // Include creator

    if (filters.search) {
      queryBuilder.where(
        "customer.fullName ILIKE :search OR customer.email ILIKE :search OR customer.phone ILIKE :search",
        { search: `%${filters.search}%` }
      );
    }

    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    const skip = (page - 1) * limit;

    queryBuilder.skip(skip).take(limit);
    queryBuilder.orderBy("customer.createdAt", "DESC");

    const [customers, totalCount] = await queryBuilder.getManyAndCount();

    return {
      data: {
        customers,
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  async getCustomerById(id) {
    const customerRepository = AppDataSource.getRepository("Customer");
    const customer = await customerRepository.findOne({
      where: { id },
      relations: ["bills", "createdBy"],
    });

    if (!customer) {
      throw new Error("Customer not found");
    }

    return customer;
  }

  async updateCustomer(id, customerData) {
    const customerRepository = AppDataSource.getRepository("Customer");

    const customer = await customerRepository.findOne({ where: { id } });
    if (!customer) {
      throw new Error("Customer not found");
    }

    Object.assign(customer, customerData);
    customer.updatedAt = new Date();

    return await customerRepository.save(customer);
  }

  async deleteCustomer(id) {
    const customerRepository = AppDataSource.getRepository("Customer");

    const customer = await customerRepository.findOne({
      where: { id },
      relations: ["bills"],
    });

    if (!customer) {
      throw new Error("Customer not found");
    }

    if (customer.bills && customer.bills.length > 0) {
      throw new Error("Cannot delete customer with existing bills");
    }

    return await customerRepository.remove(customer);
  }

  async searchCustomers(searchTerm, limit = 10) {
    const customerRepository = AppDataSource.getRepository("Customer");

    return await customerRepository
      .createQueryBuilder("customer")
      .where(
        "customer.fullName ILIKE :search OR customer.email ILIKE :search OR customer.phone ILIKE :search",
        { search: `%${searchTerm}%` }
      )
      .orderBy("customer.fullName", "ASC")
      .limit(limit)
      .getMany();
  }
}

module.exports = new CustomerService();
