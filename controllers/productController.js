const Product = require('../models/Product');
const Category = require('../models/Category');
const path = require('path');
const fs = require('fs');

// @desc    Create a new product with images
// @route   POST /api/products
// @access  Admin only
const createProduct = async (req, res) => {
  try {
    const { 
      name, 
      sku, 
      stock, 
      originalPrice, 
      discount, 
      brand, 
      category, 
      isNew, 
      inStock,
      rating,
      description,
      status,
      badges
    } = req.body;

    // Validate required fields
    if (!name || !originalPrice || !sku || !category) {
      return res.status(400).json({
        success: false,
        message: 'Name, SKU, original price, and category are required fields'
      });
    }

    // Validate category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID'
      });
    }

    // Check if SKU already exists
    const existingProduct = await Product.findOne({ sku: sku.toUpperCase() });
    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: 'Product with this SKU already exists'
      });
    }

    // Handle multiple file uploads (support all file types, not just images)
    let images = [];
    // Support multer .array('images'), .fields([{name:'images'}]), or .single('images')
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      images = req.files.map(file => file.filename);
    } else if (req.files && req.files.images && Array.isArray(req.files.images)) {
      images = req.files.images.map(file => file.filename);
    } else if (req.file) {
      images = [req.file.filename];
    }
    // Accept any file type, not just images, but still require at least one file
    if (!images.length) {
      return res.status(400).json({
        success: false,
        message: 'At least one product image/file is required'
      });
    }

    // Parse badges if present (array or string)
    let badgesArr = [];
    if (badges) {
      if (Array.isArray(badges)) {
        badgesArr = badges;
      } else if (typeof badges === 'string') {
        // badges[] from form-data comes as repeated fields or comma-separated string
        if (badges.includes(',')) {
          badgesArr = badges.split(',').map(b => b.trim());
        } else {
          badgesArr = [badges];
        }
      }
    }

    // Create product
    const product = await Product.create({
      name,
      sku: sku.toUpperCase(),
      stock: stock ? parseInt(stock) : 0,
      originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
      discount: discount ? parseFloat(discount) : undefined,
      brand: brand || undefined,
      category: category,
      isNew: isNew === 'true' || isNew === true,
      inStock: inStock !== 'false' && inStock !== false,
      rating: rating ? parseFloat(rating) : 0,
      images: images,
      description: description || undefined,
      status: status || 'active',
      badges: badgesArr.length ? badgesArr : undefined
    });

    // Populate category for response
    await product.populate('category', 'name slug');

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    // If product creation fails but images were uploaded, delete them
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach(file => {
        const imagePath = path.join(__dirname, '../uploads/products', file.filename);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      });
    } else if (req.files && req.files.images && Array.isArray(req.files.images)) {
      req.files.images.forEach(file => {
        const imagePath = path.join(__dirname, '../uploads/products', file.filename);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      });
    } else if (req.file) {
      const imagePath = path.join(__dirname, '../uploads/products', req.file.filename);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    res.status(400).json({
      success: false,
      message: 'Failed to create product',
      error: error.message
    });
  }
};

// @desc    Get all products with pagination, search, filtering, and sorting
// @route   GET /api/products
// @access  Public (Admin endpoints use isAdmin middleware)
const getAllProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      category = '',
      status = '',
      minPrice = '',
      maxPrice = '',
      inStock = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};

    // Search by name, SKU, or description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Filter by stock availability
    if (inStock !== '') {
      query.inStock = inStock === 'true';
    }

    // Build sort object
    const sort = {};
    const validSortFields = ['name', 'price', 'stock', 'rating', 'createdAt', 'updatedAt'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    sort[sortField] = sortOrder === 'asc' ? 1 : -1;

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Execute query with pagination
    const products = await Product.find(query)
      .populate('category', 'name slug parent')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const total = await Product.countDocuments(query);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message
    });
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name slug parent');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: error.message
    });
  }
};

// @desc    Update product by ID
// @route   PUT /api/products/:id
// @access  Admin only
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Validate category if provided
    if (req.body.category) {
      const categoryExists = await Category.findById(req.body.category);
      if (!categoryExists) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category ID'
        });
      }
    }

    // Handle image update
    if (req.file) {
      // Delete old images if they exist
      if (product.images && product.images.length > 0) {
        product.images.forEach(img => {
          const oldImagePath = path.join(__dirname, '../uploads/products', img);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        });
      }
      req.body.images = [req.file.filename]; // Changed from 'image' to 'images'
    }

    // Update product
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('category', 'name slug parent');

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }
    res.status(400).json({
      success: false,
      message: 'Failed to update product',
      error: error.message
    });
  }
};

// @desc    Delete product by ID
// @route   DELETE /api/products/:id
// @access  Admin only
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Delete associated images if they exist
    if (product.images && product.images.length > 0) {
      product.images.forEach(img => {
        const imagePath = path.join(__dirname, '../uploads/products', img);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: error.message
    });
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct
};
