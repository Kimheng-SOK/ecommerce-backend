const express = require('express');
const router = express.Router();
const { bannerUpload } = require('../middleware/upload');
const {
  createBanner,
  getAllBanners,
  getBannerById,
  updateBanner,
  deleteBanner
} = require('../controllers/bannerController');

// @route   POST /api/banners
// @desc    Create a new banner with image upload
// @access  Public
router.post('/', bannerUpload.single('image'), createBanner);

// @route   GET /api/banners
// @desc    Get all banners
// @access  Public
router.get('/', getAllBanners);

// @route   GET /api/banners/:id
// @desc    Get single banner by ID
// @access  Public
router.get('/:id', getBannerById);

// @route   PUT /api/banners/:id
// @desc    Update banner by ID
// @access  Public
router.put('/:id', bannerUpload.single('image'), updateBanner);

// @route   DELETE /api/banners/:id
// @desc    Delete banner by ID
// @access  Public
router.delete('/:id', deleteBanner);

module.exports = router;
