const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: [50, 'Coupon code cannot exceed 50 characters']
    },
    discount: {
      type: Number,
      required: [true, 'Discount percentage is required'],
      min: [0, 'Discount cannot be negative'],
      max: [100, 'Discount cannot exceed 100%']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      default: Date.now
    },
    validityDays: {
      type: Number,
      required: [true, 'Validity days are required'],
      min: [1, 'Validity days must be at least 1 day']
    },
    endDate: {
      type: Date
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'expired'],
      default: 'active'
    },
    usageLimit: {
      type: Number,
      min: [0, 'Usage limit cannot be negative']
    },
    usedCount: {
      type: Number,
      default: 0,
      min: [0, 'Used count cannot be negative']
    }
  },
  {
    timestamps: true
  }
);

couponSchema.pre('save', function (next) {
  if (this.startDate && this.validityDays) {
    const end = new Date(this.startDate);
    end.setDate(end.getDate() + this.validityDays);
    this.endDate = end;
  }
  next();
});

// Method to check if coupon is valid
couponSchema.methods.isValid = function() {
  const now = new Date();
  const start = new Date(this.startDate);
  const end = new Date(this.endDate);
  
  // Check if coupon is within valid date range
  if (now < start || now > end) {
    return false;
  }
  
  // Check if coupon is active
  if (this.status !== 'active') {
    return false;
  }
  
  // Check if usage limit is reached
  if (this.usageLimit && this.usedCount >= this.usageLimit) {
    return false;
  }
  
  return true;
};

// Method to check if coupon has expired
couponSchema.methods.checkExpiration = function() {
  const now = new Date();
  const end = new Date(this.endDate);
  
  if (now > end && this.status !== 'expired') {
    this.status = 'expired';
    return true;
  }
  return false;
};

// Virtual property for remaining uses
couponSchema.virtual('remainingUses').get(function() {
  if (!this.usageLimit) {
    return null; // Unlimited
  }
  return Math.max(0, this.usageLimit - this.usedCount);
});


// Create and export the Coupon model
const Coupon = mongoose.model('Coupon', couponSchema);

module.exports = Coupon;
