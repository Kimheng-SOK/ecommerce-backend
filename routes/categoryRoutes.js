const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { isAdmin } = require('../middleware/auth');
const {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/categories';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'category-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// @route   POST /api/categories
// @desc    Create a new category
// @access  Admin only (auth temporarily disabled for testing)
router.post('/', upload.single('image'), createCategory);

// @route   GET /api/categories
// @desc    Get all categories with optional filtering and nested structure
// @access  Public
// @query   parent, isActive, nested, includeProducts
router.get('/', getAllCategories);

// @route   GET /api/categories/:id
// @desc    Get single category by ID
// @access  Public
router.get('/:id', getCategoryById);

// @route   PUT /api/categories/:id
// @desc    Update category by ID
// @access  Admin only (auth temporarily disabled for testing)
router.put('/:id', upload.single('image'), updateCategory);

// @route   DELETE /api/categories/:id
// @desc    Delete category by ID
// @access  Admin only (auth temporarily disabled for testing)
router.delete('/:id', deleteCategory);

module.exports = router;
