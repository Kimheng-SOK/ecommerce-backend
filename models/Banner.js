const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema(
  {
    image: {
      type: String,
      required: [true, 'Banner image is required']
    },
    days: {
      type: Number,
      required: [true, 'Number of days is required'],
      min: [1, 'Days must be at least 1']
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required']
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required']
    },
    link: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'pending', 'expired'],
      default: 'pending'
    }
  },
  {
    timestamps: true // Automatically adds createdAt and updatedAt fields
  }
);


bannerSchema.pre('save', function(next) {
  const now = new Date();

  if (this.startDate <= now && this.endDate >= now && this.status === 'pending') {
    this.status = 'active';
  }

  if (this.endDate < now && this.status === 'active') {
    this.status = 'expired';
  } 
  next();
});

bannerSchema.virtual('currentStatus').get(function() {
  const now = new Date();

  if (this.endDate < now) return 'expired';
  if (this.startDate <= now) return 'active';
  return 'pending'; 
}); 
bannerSchema.set('toJSON', { virtuals: true });
bannerSchema.set('toObject', { virtuals: true });

// Create and export the Banner model
const Banner = mongoose.model('Banner', bannerSchema);

module.exports = Banner;
