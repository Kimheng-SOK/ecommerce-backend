const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Order = require('../models/Order');

// @route   GET /api/users/stats
// @desc    Get all users with their order stats
// @access  Public
router.get('/stats', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    const allOrders = await Order.find();

    const usersWithStats = users.map(user => {
      // METHOD 1: Match by user ID (most accurate)
      let userOrders = allOrders.filter(order => 
        order.user && order.user.toString() === user._id.toString()
      );

      // METHOD 2: Fallback to email matching if no user ID
      if (userOrders.length === 0) {
        userOrders = allOrders.filter(order => 
          order.customerEmail && order.customerEmail.toLowerCase() === user.email.toLowerCase()
        );
      }

      const totalOrders = userOrders.length;
      const totalRevenue = userOrders.reduce((sum, order) => sum + (order.totalAmount || order.amount || 0), 0);
      const completedOrders = userOrders.filter(o => o.status === 'completed').length;
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const isActive = userOrders.some(order => {
        const orderDate = new Date(order.orderDate);
        return orderDate >= thirtyDaysAgo;
      });

      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || 'N/A',
        avatar: user.avatar || '',
        memberSince: new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        stats: {
          totalOrders,
          totalRevenue,
          completedOrders,
          isActive,
          rewardPoints: Math.floor(totalRevenue * 10)
        }
      };
    });

    res.status(200).json({
      success: true,
      count: usersWithStats.length,
      data: usersWithStats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users with stats',
      error: error.message
    });
  }
});

// @route   GET /api/users/:id/orders
// @desc    Get user's orders by user ID
// @access  Public
router.get('/:id/orders', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find orders by user ID or email
    const orders = await Order.find({
      $or: [
        { user: req.params.id },
        { customerEmail: user.email.toLowerCase() }
      ]
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user orders',
      error: error.message
    });
  }
});

// @route   GET /api/users/email/:email/orders
// @desc    Get user's orders by email
// @access  Public
router.get('/email/:email/orders', async (req, res) => {
  try {
    const email = req.params.email.toLowerCase();
    
    // Find orders by email
    const orders = await Order.find({
      customerEmail: email
    }).sort({ createdAt: -1 });

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
});

module.exports = router;
