const User = require('../models/User');
const Order = require('../models/Order');

// @desc    Get user with stats (orders, revenue, active status)
// @route   GET /api/users/:id/stats
// @access  Public
const getUserStats = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Aggregate orders for this user (match by customerName or email)
    const orders = await Order.find({
      $or: [
        { customerName: new RegExp(user.name, 'i') },
        { customerLocation: new RegExp(user.email, 'i') }
      ]
    });

    // Calculate stats
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || order.amount), 0);
    const completedOrders = orders.filter(o => o.status === 'completed').length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const isActive = orders.some(order => {
      const orderDate = new Date(order.orderDate);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return orderDate >= thirtyDaysAgo;
    });

    res.status(200).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          memberSince: user.createdAt
        },
        stats: {
          totalOrders,
          totalRevenue,
          completedOrders,
          pendingOrders,
          isActive,
          averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user stats',
      error: error.message
    });
  }
};

// @desc    Get all users with their stats
// @route   GET /api/users/stats
// @access  Public
const getAllUsersWithStats = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    const allOrders = await Order.find();

    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        // Find orders for this user
        const userOrders = allOrders.filter(order =>
          order.customerName.toLowerCase().includes(user.name.toLowerCase()) ||
          order.customerLocation.toLowerCase().includes(user.email.toLowerCase())
        );

        const totalOrders = userOrders.length;
        const totalRevenue = userOrders.reduce((sum, order) => sum + (order.totalAmount || order.amount), 0);
        const completedOrders = userOrders.filter(o => o.status === 'completed').length;
        const isActive = userOrders.some(order => {
          const orderDate = new Date(order.orderDate);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return orderDate >= thirtyDaysAgo;
        });

        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          avatar: user.avatar,
          memberSince: user.createdAt,
          stats: {
            totalOrders,
            totalRevenue,
            completedOrders,
            isActive,
            rewardPoints: Math.floor(totalRevenue * 10) // 10 points per dollar
          }
        };
      })
    );

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
};

module.exports = {
  getUserStats,
  getAllUsersWithStats
  // ...other user controller methods
};
