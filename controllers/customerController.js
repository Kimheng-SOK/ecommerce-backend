const Customer = require('../models/User');
// @desc    Get all customers with pagination
// @route   GET /api/customers
// @access  Public
const getAllCustomers = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, search = '' } = req.query;
    const query = { role: 'customer' };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (parseInt(page) - 1) * parseInt(pageSize);

    const customers = await Customer.find(query)
      .select('-password') // Exclude password field
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(pageSize));

    const total = await Customer.countDocuments(query);

    res.status(200).json({
      success: true,
      count: customers.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(pageSize)),
      data: customers.length ? customers : [],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customers',
      error: error.message
    });
  }
};

// @desc    Get single customer by ID
// @route   GET /api/customers/:id
// @access  Public
const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).select('-password');

    if (!customer || customer.role !== 'customer') {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.status(200).json({
      success: true,
      data: customer.toJSON()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer',
      error: error.message
    });
  }
};

// @desc    Update customer by ID
// @route   PUT /api/customers/:id
// @access  Public
const updateCustomer = async (req, res) => {
  try {
    const { name, phone, email, avatar, purchasedItems, rewardPoints, isActive } = req.body;

    const customer = await Customer.findById(req.params.id);
    if (!customer || customer.role !== 'customer') {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const updateDate = {};
    if (name) updateDate.name = name;
    if (email) updateDate.email = email;
    if (phone !== undefined) updateDate.phone = phone;
    if (avatar !== undefined) updateDate.avatar = avatar;
    if (purchasedItems !== undefined) updateDate.purchasedItems = purchasedItems;
    if (rewardPoints !== undefined) updateDate.rewardPoints = rewardPoints;
    if (isActive !== undefined) updateDate.isActive = isActive;
    
    const updatedCustomer = await Customer.findByIdAndUpdate(
      req.params.id,
      { $set: updateDate },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      data: updatedCustomer
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update customer',
      error: error.message
    });
  }
};

// @desc    Delete customer by ID
// @route   DELETE /api/customers/:id
// @access  Public
const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete customer',
      error: error.message
    });
  }
};

module.exports = {
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer
};
