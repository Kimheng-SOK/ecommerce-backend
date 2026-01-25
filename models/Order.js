const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: [true, 'Order number is required'],
      unique: true,
      trim: true,
      uppercase: true
    },
    // Add user reference for proper linking
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    productName: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true
    },
    productImage: {
      type: String,
      default: ''
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1']
    },
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true
    },
    // Store user email for matching
    customerEmail: {
      type: String,
      trim: true,
      lowercase: true
    },
    customerLocation: {
      type: String,
      required: [true, 'Customer location is required'],
      trim: true
    },
    amount: {
      type: Number,
      required: [true, 'Order amount is required'],
      min: [0, 'Amount cannot be negative']
    },
    // Add shipping details
    shippingMethod: {
      type: String,
      enum: ['shipping', 'pickup'],
      default: 'shipping'
    },
    shippingCost: {
      type: Number,
      default: 0,
      min: [0, 'Shipping cost cannot be negative']
    },
    // Add coupon details
    couponCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: ''
    },
    discountPercent: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative'],
      max: [100, 'Discount cannot exceed 100%']
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: [0, 'Discount amount cannot be negative']
    },
    subtotal: {
      type: Number,
      required: true,
      min: [0, 'Subtotal cannot be negative']
    },
    totalAmount: {
      type: Number,
      required: true,
      min: [0, 'Total amount cannot be negative']
    },
    paymentMethod: {
      type: String,
      enum: ['card', 'cash', 'qr'],
      default: 'cash'
    },
    orderDate: {
      type: Date,
      required: [true, 'Order date is required'],
      default: Date.now
    },
    orderTime: {
      type: String,
      trim: true,
      default: ''
    },
    deliveryDate: {
      type: Date,
      required: [true, 'Delivery date is required'],
      validate: {
        validator: function(value) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return value >= today;
        },
        message: 'Delivery date must be today or a future date'
      }
    },
    deliveryTime: {
      type: String,
      trim: true,
      default: ''
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed', 'cancelled'],
      default: 'pending'
    }
  },
  {
    timestamps: true
  }
);

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
