const Category = require('../models/Category');
const Product = require('../models/Product');
const path = require('path');
const fs = require('fs');

// @desc    Create a new category
// @route   POST /api/categories
// @access  Admin only
const createCategory = async (req, res) => {
  try {
    const { name, description, parent, isActive, order } = req.body;
    
    // Handle uploaded image
    const image = req.file ? `/uploads/categories/${req.file.filename}` : null;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }

    // Clean parent field - handle empty strings, "null", "undefined", etc.
    const cleanParent = parent && parent !== 'null' && parent !== 'undefined' && parent.trim() !== '' ? parent : null;

    // Validate parent category if provided
    if (cleanParent) {
      const parentCategory = await Category.findById(cleanParent);
      if (!parentCategory) {
        return res.status(400).json({
          success: false,
          message: 'Invalid parent category ID'
        });
      }
    }

    // Check if category name already exists
    const existingCategory = await Category.findOne({ name: name.trim() });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }

    const category = await Category.create({
      name: name.trim(),
      description: description || undefined,
      parent: cleanParent || undefined,
      image: image || undefined,
      isActive: isActive !== undefined ? isActive : true,
      order: order || 0
    });

    // Populate parent if exists
    if (category.parent) {
      await category.populate('parent', 'name slug');
    }

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to create category',
      error: error.message
    });
  }
};

// @desc    Get all categories with optional filtering and nested structure
// @route   GET /api/categories
// @access  Public
const getAllCategories = async (req, res) => {
  try {
    const { 
      parent = '', 
      isActive = '', 
      nested = 'false',
      includeProducts = 'false'
    } = req.query;

    // Build query
    const query = {};

    // Filter by parent (empty string means top-level categories)
    if (parent === '') {
      query.parent = null;
    } else if (parent) {
      query.parent = parent;
    }

    // Filter by active status
    if (isActive !== '') {
      query.isActive = isActive === 'true';
    }

    // Get categories
    let categories = await Category.find(query)
      .populate('parent', 'name slug')
      .sort({ order: 1, name: 1 });

    // If nested structure requested, build tree
    if (nested === 'true') {
      categories = buildCategoryTree(categories);
    }

    // Include product count if requested
    if (includeProducts === 'true') {
      for (const category of categories) {
        const productCount = await Product.countDocuments({ category: category._id });
        category.productCount = productCount;
      }
    }

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
};

// Helper function to build nested category tree
const buildCategoryTree = (categories) => {
  const categoryMap = new Map();
  const rootCategories = [];

  // First pass: create map of all categories
  categories.forEach(cat => {
    categoryMap.set(cat._id.toString(), { ...cat.toObject(), children: [] });
  });

  // Second pass: build tree structure
  categories.forEach(cat => {
    const categoryObj = categoryMap.get(cat._id.toString());
    if (cat.parent) {
      const parentObj = categoryMap.get(cat.parent.toString());
      if (parentObj) {
        parentObj.children.push(categoryObj);
      } else {
        // Parent not in current result set, treat as root
        rootCategories.push(categoryObj);
      }
    } else {
      rootCategories.push(categoryObj);
    }
  });

  return rootCategories;
};

// @desc    Get single category by ID
// @route   GET /api/categories/:id
// @access  Public
const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('parent', 'name slug')
      .populate('children', 'name slug isActive');

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Get product count
    const productCount = await Product.countDocuments({ category: category._id });
    category.productCount = productCount;

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category',
      error: error.message
    });
  }
};

// @desc    Update category by ID
// @route   PUT /api/categories/:id
// @access  Admin only
const updateCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Prevent setting itself as parent
    if (req.body.parent && req.body.parent === req.params.id) {
      return res.status(400).json({
        success: false,
        message: 'Category cannot be its own parent'
      });
    }

    // Validate parent category if provided
    if (req.body.parent) {
      const parentCategory = await Category.findById(req.body.parent);
      if (!parentCategory) {
        return res.status(400).json({
          success: false,
          message: 'Invalid parent category ID'
        });
      }
    }

    // Handle uploaded image
    if (req.file) {
      // Delete old image if it exists
      if (category.image) {
        const oldImagePath = path.join(__dirname, '..', category.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      req.body.image = `/uploads/categories/${req.file.filename}`;
    }

    // Update category
    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('parent', 'name slug')
      .populate('children', 'name slug isActive');

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: updatedCategory
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID'
      });
    }
    res.status(400).json({
      success: false,
      message: 'Failed to update category',
      error: error.message
    });
  }
};

// @desc    Delete category by ID
// @route   DELETE /api/categories/:id
// @access  Admin only
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if category has children
    const childrenCount = await Category.countDocuments({ parent: req.params.id });
    if (childrenCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with subcategories. Please delete or move subcategories first.'
      });
    }

    // Check if category has products
    const productCount = await Product.countDocuments({ category: req.params.id });
    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category with ${productCount} product(s). Please reassign or delete products first.`
      });
    }

    // Delete image file if it exists
    if (category.image) {
      const imagePath = path.join(__dirname, '..', category.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await Category.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to delete category',
      error: error.message
    });
  }
};

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
};
