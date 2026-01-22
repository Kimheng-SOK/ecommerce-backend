# Ecommerce Backend API

A simple, beginner-friendly ecommerce backend built with Node.js, Express, and MongoDB. Designed for testing Vue.js frontend applications.

## 🚀 Features

- RESTful API for product management
- Image upload with Multer (stores images locally)
- MongoDB database with Mongoose
- CORS enabled for frontend integration
- Static file serving for product images
- Image validation (JPEG, JPG, PNG only)
- Unique filename generation to prevent conflicts

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **MongoDB** installed locally OR a MongoDB Atlas account
- **npm** (comes with Node.js)

## 🛠️ Installation & Setup

### Step 1: Install Dependencies

```bash
npm install
```

This will install:
- `express` - Web framework
- `mongoose` - MongoDB object modeling
"express-session": "^1.17.3",
"cookie-parser": "^1.4.6",
"bcryptjs": "^2.4.3",
"dotenv": "^16.3.1",
- `multer` - File upload middleware
- `cors` - Cross-Origin Resource Sharing
- `dotenv` - Environment variable management
- `nodemon` - Development tool (auto-restart server)

### Step 2: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   copy .env.example .env
   ```
   (On Mac/Linux: `cp .env.example .env`)

2. Edit `.env` and set your MongoDB connection string:
   ```env
   MONGODB_URI=mongodb://localhost:27017/ecommerce
   PORT=5000
   ```

   **For MongoDB Atlas (Cloud):**
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ecommerce
   PORT=5000
   ```

### Step 3: Start MongoDB

**Local MongoDB:**
- Make sure MongoDB is running on your machine
- Default connection: `mongodb://localhost:27017`

**MongoDB Atlas:**
- No local setup needed, just use your connection string

### Step 4: Run the Server

**Development mode (with auto-restart):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

You should see:
```
✅ Connected to MongoDB successfully
🚀 Server running on http://localhost:5000
📁 Static files served from: .../uploads
```

## 📁 Project Structure

```
Backend/
├── server.js                 # Main server file
├── package.json              # Dependencies and scripts
├── .env                      # Environment variables (create this)
├── .env.example             # Example environment file
├── models/
│   └── Product.js           # Product Mongoose model
├── routes/
│   └── productRoutes.js     # Product API routes
├── controllers/
│   └── productController.js # Product business logic
├── middleware/
│   └── upload.js            # Multer configuration
└── uploads/
    └── products/            # Uploaded product images (auto-created)
```

## 📡 API Endpoints

### Base URL
```
http://localhost:5000
```

### 1. Create Product (with Image Upload)

**POST** `/api/products`

**Content-Type:** `multipart/form-data`

**Body (Form Data):**
- `name` (string, required) - Product name
- `price` (number, required) - Product price
- `stock` (number, optional) - Product stock quantity (default: 0)
- `image` (file, optional) - Product image (JPEG, JPG, PNG only, max 5MB)

**Example Response:**
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "name": "Laptop",
    "price": 999.99,
    "stock": 50,
    "image": "laptop-1704067200000-123456789.jpg",
    "createdAt": "2024-01-01T12:00:00.000Z",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

### 2. Get All Products

**GET** `/api/products`

**Example Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "name": "Laptop",
      "price": 999.99,
      "stock": 50,
      "image": "laptop-1704067200000-123456789.jpg",
      "createdAt": "2024-01-01T12:00:00.000Z",
      "updatedAt": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

### 3. Get Product by ID

**GET** `/api/products/:id`

**Example Response:**
```json
{
  "success": true,
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "name": "Laptop",
    "price": 999.99,
    "stock": 50,
    "image": "laptop-1704067200000-123456789.jpg",
    "createdAt": "2024-01-01T12:00:00.000Z",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

## 🖼️ Image Access

Uploaded images are served as static files. You can access them via:

```
http://localhost:5000/uploads/products/filename.jpg
```

The `image` field in the product document stores only the filename (e.g., `laptop-1704067200000-123456789.jpg`).

## 🧪 Testing with Postman

### Create Product with Image:

1. **Method:** POST
2. **URL:** `http://localhost:5000/api/products`
3. **Body Type:** `form-data`
4. **Fields:**
   - `name`: `Laptop` (Text)
   - `price`: `999.99` (Text)
   - `stock`: `50` (Text)
   - `image`: [Select File] (File)
5. **Send Request**

### Get All Products:

1. **Method:** GET
2. **URL:** `http://localhost:5000/api/products`
3. **Send Request**

### Get Product by ID:

1. **Method:** GET
2. **URL:** `http://localhost:5000/api/products/{product_id}`
3. **Send Request**

## 💻 Vue.js Integration Example

### Install Axios

```bash
npm install axios
```

### Upload Product with Image

```javascript
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/products';

// Create product with image
async function createProduct(productData, imageFile) {
  const formData = new FormData();
  formData.append('name', productData.name);
  formData.append('price', productData.price);
  formData.append('stock', productData.stock);
  
  if (imageFile) {
    formData.append('image', imageFile);
  }

  try {
    const response = await axios.post(`${API_URL}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
}

// Usage
const product = {
  name: 'Laptop',
  price: 999.99,
  stock: 50
};

const imageFile = document.querySelector('#imageInput').files[0];
createProduct(product, imageFile);
```

### Get All Products

```javascript
async function getAllProducts() {
  try {
    const response = await axios.get(`${API_URL}`);
    return response.data.data; // Array of products
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
}
```

### Display Product Image in Vue Template

```vue
<template>
  <div v-for="product in products" :key="product._id">
    <h3>{{ product.name }}</h3>
    <p>${{ product.price }}</p>
    <p>Stock: {{ product.stock }}</p>
    <img 
      v-if="product.image" 
      :src="`http://localhost:5000/uploads/products/${product.image}`" 
      :alt="product.name"
    />
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      products: []
    };
  },
  async mounted() {
    try {
      const response = await axios.get('http://localhost:5000/api/products');
      this.products = response.data.data;
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  }
};
</script>
```

## 🔒 Image Validation

- **Allowed Types:** JPEG, JPG, PNG
- **Max File Size:** 5MB (configurable in `middleware/upload.js`)
- **Storage:** Local filesystem (`uploads/products/`)
- **Filename:** Unique (timestamp + random number + original name)

## ⚠️ Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message (development only)"
}
```

Common errors:
- **400:** Validation errors (missing fields, invalid file type)
- **404:** Product not found
- **500:** Server errors

## 🎯 Next Steps (Optional Enhancements)

- [ ] Update product endpoint (PUT/PATCH)
- [ ] Delete product endpoint
- [ ] Update/delete product image
- [ ] Multiple image uploads per product
- [ ] File size limits configuration
- [ ] Cloud storage integration (AWS S3, Cloudinary)
- [ ] Authentication & authorization
- [ ] Product categories
- [ ] Search and filtering

## 📝 Notes

- Images are stored locally in `uploads/products/` directory
- Only the filename is stored in MongoDB (not the full path)
- The server automatically creates the uploads directory if it doesn't exist
- CORS is enabled for all origins (adjust in production)
- No authentication is implemented (add if needed)

## 🐛 Troubleshooting

**MongoDB Connection Error:**
- Check if MongoDB is running (local) or connection string is correct (Atlas)
- Verify `.env` file has correct `MONGODB_URI`

**Image Upload Fails:**
- Check file type (must be JPEG, JPG, or PNG)
- Check file size (max 5MB)
- Ensure `uploads/products/` directory exists

**CORS Errors:**
- Make sure CORS is enabled (already configured)
- Check if frontend URL matches allowed origins

## 📄 License

ISC

---

**Happy Coding! 🎉**
