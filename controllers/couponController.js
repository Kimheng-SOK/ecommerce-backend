const Coupon = require('../models/Coupon');

// @desc    Create a new coupon
// @route   POST /api/coupons
// @access  Public
const createCoupon = async (req, res) => {
  try {
    const { code, discount, description, startDate, validityDays, status, usageLimit } = req.body;

    if (!code || discount === undefined || validityDays === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code, discount, and validity days are required'
      });
    }

    const discountNum = parseFloat(discount);
    if (discountNum < 0 || discountNum > 100) {
      return res.status(400).json({
        success: false,
        message: 'Discount must be between 0 and 100'
      });
    }

    const daysNum = parseInt(validityDays);
    if (daysNum < 1) {
      return res.status(400).json({
        success: false,
        message: 'Validity days must be at least 1 day'
      });
    }

    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase()});
    if (existingCoupon) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code already exists'
      });
    }
    
    const start = startDate ? new Date(startDate) : new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + daysNum);

    const coupon = await Coupon.create({
      code: code.toUpperCase(), 
      discount: discountNum,
      description: description || null,
      startDate: start,
      endDate: end,
      validityDays: daysNum,
      status: status || 'active',
      usageLimit: usageLimit ? parseInt(usageLimit) : null
    });

    res.status(201).json({
      success: true,
      message: 'Coupon created successfully',
      data: coupon
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to create coupon',
      error: error.message
    });
  }
};

// @desc    Get all coupons
// @route   GET /api/coupons
// @access  Public
const getAllCoupons = async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};

    const coupons = await Coupon.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: coupons.length,
      data: coupons
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch coupons',
      error: error.message
    });
  }
};

// @desc    Get single coupon by ID
// @route   GET /api/coupons/:id
// @access  Public
const getCouponById = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    res.status(200).json({
      success: true,
      data: coupon
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch coupon',
      error: error.message
    });
  }
};

// @desc    Get coupon by code
// @route   GET /api/coupons/code/:code
// @access  Public
const getCouponByCode = async (req, res) => {
  try {
    const coupon = await Coupon.findOne({ code: req.params.code.toUpperCase() });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    const now = new Date();

    if (coupon.startDate && now < coupon.startDate) {
      return res.status(400).json({
        success: false,
        message: 'Coupon is not yet active'
      })
    }

    // Check if coupon is expired
    if (coupon.endDate && now > coupon.endDate) {
      await Coupon.findByIdAndUpdate(coupon._id, { status: 'expired' });
      return res.status(400).json({
        success: false,
        message: 'Coupon has expired'
      });
    }

    // Check if coupon is active
    if (coupon.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Coupon is not active'
      });
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({
        success: false,
        message: 'Coupon usage limit reached'
      });
    }

    res.status(200).json({
      success: true,
      data: [coupon]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch coupon',
      error: error.message
    });
  }
};

// @desc    Update coupon by ID
// @route   PUT /api/coupons/:id
// @access  Public
const updateCoupon = async (req, res) => {
  try {
    // Uppercase code if provided
    if (req.body.code) {
      req.body.code = req.body.code.toUpperCase();
    }

    // Get existing coupon first
    const existingCoupon = await Coupon.findById(req.params.id);
    if (!existingCoupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    // Recalculate endDate if startDate or validityDays changed
    const newStartDate = req.body.startDate ? new Date(req.body.startDate) : existingCoupon.startDate;
    const newValidityDays = req.body.validityDays !== undefined ? parseInt(req.body.validityDays) : existingCoupon.validityDays;
    
    if (req.body.startDate || req.body.validityDays !== undefined) {
      const end = new Date(newStartDate);
      end.setDate(end.getDate() + newValidityDays);
      req.body.endDate = end;
    }

    // Validate discount if provided
    if (req.body.discount !== undefined) {
      const discountNum = parseFloat(req.body.discount);
      if (discountNum < 0 || discountNum > 100) {
        return res.status(400).json({
          success: false,
          message: 'Discount must be between 0 and 100'
        });
      }
      req.body.discount = discountNum;
    }

    // Validate validityDays if provided
    if (req.body.validityDays !== undefined && newValidityDays < 1) {
      return res.status(400).json({
        success: false,
        message: 'Validity days must be at least 1'
      });
    }

    const coupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Coupon updated successfully',
      data: coupon
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update coupon',
      error: error.message
    });
  }
};

// @desc    Delete coupon by ID
// @route   DELETE /api/coupons/:id
// @access  Public
const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Coupon deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete coupon',
      error: error.message
    });
  }
};

module.exports = {
  createCoupon,
  getAllCoupons,
  getCouponById,
  getCouponByCode,
  updateCoupon,
  deleteCoupon
};
