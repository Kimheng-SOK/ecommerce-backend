const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

// @desc    Create a new order
// @route   POST /api/orders
// @access  Public
const createOrder = async (req, res) => {
  try {
    const {
      orderNumber,
      user,
      product,
      productName,
      productImage,
      quantity,
      customerName,
      customerEmail,
      customerLocation,
      amount,
      shippingMethod,
      shippingCost,
      couponCode,
      discountPercent,
      discountAmount,
      subtotal,
      totalAmount,
      paymentMethod,
      orderDate,
      orderTime,
      deliveryDate,
      deliveryTime,
      status
    } = req.body;

    if (!orderNumber || !productName || !quantity || !customerName || !customerLocation) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Validate delivery date
    const parsedDeliveryDate = deliveryDate ? new Date(deliveryDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (parsedDeliveryDate < today) {
      return res.status(400).json({
        success: false,
        message: 'Delivery date must be today or a future date'
      });
    }

    // Check and update product stock
    if (product) {
      const productDoc = await Product.findById(product);
      
      if (!productDoc) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      if (productDoc.stock < quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock. Only ${productDoc.stock} items available.`
        });
      }

      productDoc.stock -= parseInt(quantity);
      
      if (productDoc.stock === 0) {
        productDoc.inStock = false;
      }
      
      await productDoc.save();
    }

    const order = await Order.create({
      orderNumber: orderNumber.toUpperCase(),
      user: user || null, // Save user ID if provided
      product: product || null,
      productName,
      productImage: productImage || '',
      quantity: parseInt(quantity),
      customerName,
      customerEmail: customerEmail || '', // Save email for matching
      customerLocation,
      amount: parseFloat(amount || 0),
      shippingMethod: shippingMethod || 'shipping',
      shippingCost: parseFloat(shippingCost || 0),
      couponCode: couponCode || '',
      discountPercent: parseFloat(discountPercent || 0),
      discountAmount: parseFloat(discountAmount || 0),
      subtotal: parseFloat(subtotal || amount || 0),
      totalAmount: parseFloat(totalAmount || amount || 0),
      paymentMethod: paymentMethod || 'cash',
      orderDate: orderDate ? new Date(orderDate) : new Date(),
      orderTime: orderTime || '',
      deliveryDate: parsedDeliveryDate,
      deliveryTime: deliveryTime || '',
      status: status || 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Public
const getAllOrders = async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};

    const orders = await Order.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
};

// @desc    Get single order by ID
// @route   GET /api/orders/:id
// @access  Public
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      error: error.message
    });
  }
};

// @desc    Update order by ID
// @route   PUT /api/orders/:id
// @access  Public
const updateOrder = async (req, res) => {
  try {
    // Validate delivery date if provided
    if (req.body.deliveryDate) {
      const deliveryDate = new Date(req.body.deliveryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (deliveryDate < today) {
        return res.status(400).json({
          success: false,
          message: 'Delivery date must be today or a future date'
        });
      }
    }

    // Get the old order to restore stock if cancelled
    const oldOrder = await Order.findById(req.params.id);
    if (!oldOrder) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // If order status is changing to cancelled, restore the stock
    if (req.body.status === 'cancelled' && oldOrder.status !== 'cancelled' && oldOrder.product) {
      const productDoc = await Product.findById(oldOrder.product);
      if (productDoc) {
        productDoc.stock += oldOrder.quantity;
        productDoc.inStock = true;
        await productDoc.save();
      }
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Order updated successfully',
      data: order
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update order',
      error: error.message
    });
  }
};

// @desc    Delete order by ID
// @route   DELETE /api/orders/:id
// @access  Public
const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Restore stock if order is not cancelled or completed
    if (order.status !== 'cancelled' && order.status !== 'completed' && order.product) {
      const productDoc = await Product.findById(order.product);
      if (productDoc) {
        productDoc.stock += order.quantity;
        productDoc.inStock = true;
        await productDoc.save();
      }
    }

    await Order.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete order',
      error: error.message
    });
  }
};

module.exports = {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrder,
  deleteOrder
};
