const express = require('express');
const router = express.Router();
const { productUpload } = require('../middleware/upload');
const { isAdmin } = require('../middleware/auth');
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');

// @route   POST /api/products
// @desc    Create a new product with image upload
// @access  Admin only
// @note    Use 'image' as the field name in form-data (Postman/Vue)
// router.post('/', isAdmin, productUpload.single('image'), createProduct);
router.post('/', productUpload.array('images', 10), createProduct);

// @route   GET /api/products
// @desc    Get all products with pagination, search, filtering, and sorting
// @access  Public
// @query   page, limit, search, category, status, minPrice, maxPrice, inStock, sortBy, sortOrder
router.get('/', getAllProducts);

// @route   GET /api/products/:id
// @desc    Get single product by ID
// @access  Public
router.get('/:id', getProductById);

// @route   PUT /api/products/:id
// @desc    Update product by ID
// @access  Admin only
// router.put('/:id', isAdmin, productUpload.single('image'), updateProduct);
router.put('/:id', productUpload.array('images', 10), updateProduct);

// @route   DELETE /api/products/:id
// @desc    Delete product by ID
// @access  Admin only
// router.delete('/:id', isAdmin, deleteProduct);
router.delete('/:id', deleteProduct);

module.exports = router;
