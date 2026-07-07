-- GrabDeals E-Commerce Platform Database Schema

-- Categories Table
DROP TABLE IF EXISTS categories;
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  imageUrl TEXT,
  productCount INTEGER DEFAULT 0,
  isActive INTEGER DEFAULT 1,
  createdAt INTEGER,
  updatedAt INTEGER
);

-- Products Table with Enhanced Fields
DROP TABLE IF EXISTS products;
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  shortDescription TEXT,
  price REAL NOT NULL,
  discountPrice REAL,
  category TEXT NOT NULL,
  tags TEXT, -- Stored as JSON string
  imageUrl TEXT,
  imageUrls TEXT, -- Multiple images JSON array
  downloadUrl TEXT,
  stock INTEGER DEFAULT 0,
  rating REAL DEFAULT 0,
  reviewCount INTEGER DEFAULT 0,
  isActive INTEGER DEFAULT 1,
  isFeatured INTEGER DEFAULT 0,
  salesCount INTEGER DEFAULT 0,
  viewCount INTEGER DEFAULT 0,
  createdBy TEXT,
  createdAt INTEGER,
  updatedAt INTEGER,
  FOREIGN KEY(category) REFERENCES categories(id)
);

-- Orders Table with Enhanced Tracking
DROP TABLE IF EXISTS orders;
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  items TEXT NOT NULL, -- Stored as JSON string
  totalAmount REAL NOT NULL,
  subtotal REAL NOT NULL,
  tax REAL DEFAULT 0,
  shippingCost REAL DEFAULT 0,
  discountAmount REAL DEFAULT 0,
  status TEXT DEFAULT 'pending', -- pending, processing, shipped, delivered, cancelled
  paymentId TEXT,
  paymentMethod TEXT,
  paymentStatus TEXT DEFAULT 'pending',
  shippingAddress TEXT, -- JSON with address details
  estimatedDelivery INTEGER,
  trackedAt TEXT, -- Delivery tracking status updates JSON array
  notes TEXT,
  createdAt INTEGER,
  updatedAt INTEGER,
  FOREIGN KEY(userId) REFERENCES users(uid)
);

-- Users Table
DROP TABLE IF EXISTS users;
CREATE TABLE IF NOT EXISTS users (
  uid TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  displayName TEXT,
  role TEXT DEFAULT 'user', -- user, admin, seller
  avatar TEXT,
  createdAt INTEGER,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  zipCode TEXT,
  totalOrders INTEGER DEFAULT 0,
  totalSpent REAL DEFAULT 0,
  isVerified INTEGER DEFAULT 0,
  isBanned INTEGER DEFAULT 0,
  updatedAt INTEGER
);

-- User Activity & Analytics Tracking
DROP TABLE IF EXISTS userActivity;
CREATE TABLE IF NOT EXISTS userActivity (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  activityType TEXT NOT NULL, -- view, click, add_to_cart, purchase, search
  productId TEXT,
  categoryId TEXT,
  metadata TEXT, -- JSON with additional info
  ipAddress TEXT,
  userAgent TEXT,
  referrer TEXT,
  createdAt INTEGER,
  FOREIGN KEY(userId) REFERENCES users(uid)
);

-- Product Reviews & Ratings
DROP TABLE IF EXISTS reviews;
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  productId TEXT NOT NULL,
  userId TEXT NOT NULL,
  rating INTEGER NOT NULL, -- 1-5 stars
  title TEXT,
  content TEXT,
  helpfulCount INTEGER DEFAULT 0,
  verified INTEGER DEFAULT 0,
  createdAt INTEGER,
  updatedAt INTEGER,
  FOREIGN KEY(productId) REFERENCES products(id),
  FOREIGN KEY(userId) REFERENCES users(uid)
);

-- Order Tracking History
DROP TABLE IF EXISTS orderTracking;
CREATE TABLE IF NOT EXISTS orderTracking (
  id TEXT PRIMARY KEY,
  orderId TEXT NOT NULL,
  status TEXT NOT NULL,
  location TEXT,
  message TEXT,
  timestamp INTEGER,
  FOREIGN KEY(orderId) REFERENCES orders(id)
);

-- Analytics Summary Table
DROP TABLE IF EXISTS analyticsDaily;
CREATE TABLE IF NOT EXISTS analyticsDaily (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL UNIQUE,
  totalVisits INTEGER DEFAULT 0,
  uniqueUsers INTEGER DEFAULT 0,
  totalOrders INTEGER DEFAULT 0,
  totalRevenue REAL DEFAULT 0,
  totalProducts INTEGER DEFAULT 0,
  avgOrderValue REAL DEFAULT 0,
  conversionRate REAL DEFAULT 0,
  topCategories TEXT, -- JSON array of top categories
  createdAt INTEGER
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(isFeatured);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(isActive);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(userId);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(createdAt);
CREATE INDEX IF NOT EXISTS idx_activity_user ON userActivity(userId);
CREATE INDEX IF NOT EXISTS idx_activity_type ON userActivity(activityType);
CREATE INDEX IF NOT EXISTS idx_activity_date ON userActivity(createdAt);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(productId);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(userId);
CREATE INDEX IF NOT EXISTS idx_tracking_order ON orderTracking(orderId);
CREATE INDEX IF NOT EXISTS idx_analytics_date ON analyticsDaily(date);
