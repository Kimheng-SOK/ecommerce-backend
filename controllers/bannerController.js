const Banner = require('../models/Banner');
const path = require('path');
const fs = require('fs');

// @desc    Create a new banner
// @route   POST /api/banners
// @access  Public
const createBanner = async (req, res) => {
  try {
    const { requestedDate, days, startDate, link, status } = req.body;

    if (!startDate || !days) {
      return res.status(400).json({
        success: false,
        message: 'Start date and number of days are required'
      });
    }

    const imageFilename = req.file ? req.file.filename : null;

    if (!imageFilename) {
      return res.status(400).json({
        success: false,
        message: 'Banner image is required'
      });
    }

    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + parseInt(days));

    const banner = await Banner.create({
      requestedDate: requestedDate || new Date(),
      image: imageFilename,
      days: parseInt(days),
      startDate: start,
      endDate: end,
      link,
      status: status || 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Banner created successfully',
      data: banner
    });
  } catch (error) {
    if (req.file) {
      const imagePath = path.join(__dirname, '../uploads/banners', req.file.filename);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    res.status(400).json({
      success: false,
      message: 'Failed to create banner',
      error: error.message
    });
  }
};

// @desc    Get all banners
// @route   GET /api/banners
// @access  Public
const getAllBanners = async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};

    const banners = await Banner.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: banners.length,
      data: banners
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch banners',
      error: error.message
    });
  }
};

// @desc    Get single banner by ID
// @route   GET /api/banners/:id
// @access  Public
const getBannerById = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    res.status(200).json({
      success: true,
      data: banner
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch banner',
      error: error.message
    });
  }
};

// @desc    Update banner by ID
// @route   PUT /api/banners/:id
// @access  Public
const updateBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    if (req.body.startDate && req.body.days) {
      const newStart = req.body.startDate ? new Date(req.body.startDate) : banner.startDate;
      const newDays = req.body.days ? parseInt(req.body.days) : banner.days;
      const newEnd = new Date(newStart);
      newEnd.setDate(newEnd.getDate() + newDays);
      req.body.endDate = newEnd;
    }

    if (req.file) {
      if (banner.image) {
        const oldImagePath = path.join(__dirname, '../uploads/banners', banner.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      req.body.image = req.file.filename;
    }

    const updatedBanner = await Banner.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Banner updated successfully',
      data: updatedBanner
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update banner',
      error: error.message
    });
  }
};

// @desc    Delete banner by ID
// @route   DELETE /api/banners/:id
// @access  Public
const deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    if (banner.image) {
      const imagePath = path.join(__dirname, '../uploads/banners', banner.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await Banner.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Banner deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete banner',
      error: error.message
    });
  }
};

module.exports = {
  createBanner,
  getAllBanners,
  getBannerById,
  updateBanner,
  deleteBanner
};
