const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api/', limiter);

// CORS configuration
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    process.env.FRONTEND_PROD_URL || 'https://qris-payvoicely.vercel.app'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json({ limit: '10mb' })); // For handling base64 QR codes
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB Atlas');
  console.log(`🗄️  Database: ${mongoose.connection.db.databaseName}`);
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1);
});

// Invoice Schema
const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  merchantInfo: {
    name: String,
    location: String
  },
  customerInfo: {
    name: { type: String, required: true },
    email: String,
    phone: String,
    address: String
  },
  invoiceDetails: {
    invoiceNumber: String,
    date: String,
    dueDate: String,
    notes: String
  },
  items: [{
    id: String,
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 }
  }],
  serviceFee: String,
  feeType: String,
  feeValue: String,
  subtotal: { type: Number, required: true, min: 0 },
  serviceFeeAmount: { type: Number, default: 0, min: 0 },
  total: { type: Number, required: true, min: 0 },
  dynamicQRCode: String,
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
invoiceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Invoice = mongoose.model('Invoice', invoiceSchema);

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'QRIS Invoice Backend API is running!',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Info
app.get('/api', (req, res) => {
  res.json({
    name: 'QRIS Invoice Generator API',
    version: '1.0.0',
    description: 'Backend API for managing QRIS invoices',
    endpoints: {
      health: 'GET /api/health',
      invoices: {
        create: 'POST /api/invoices',
        getByNumber: 'GET /api/invoices/:invoiceNumber',
        getAll: 'GET /api/invoices',
        delete: 'DELETE /api/invoices/:invoiceNumber'
      }
    },
    author: 'PayInvoicely Team'
  });
});

// Save invoice
app.post('/api/invoices', async (req, res) => {
  try {
    const invoiceData = req.body;

    // Validate required fields
    if (!invoiceData.invoiceNumber || !invoiceData.customerInfo?.name) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: invoiceNumber and customerInfo.name'
      });
    }

    // Validate items
    if (!invoiceData.items || !Array.isArray(invoiceData.items) || invoiceData.items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one item is required'
      });
    }

    // Check if invoice number already exists
    const existingInvoice = await Invoice.findOne({
      invoiceNumber: invoiceData.invoiceNumber
    });

    if (existingInvoice) {
      return res.status(409).json({
        success: false,
        error: 'Invoice number already exists'
      });
    }

    // Create new invoice
    const invoice = new Invoice(invoiceData);
    const savedInvoice = await invoice.save();

    res.status(201).json({
      success: true,
      message: 'Invoice saved successfully',
      invoiceId: savedInvoice._id,
      invoiceNumber: savedInvoice.invoiceNumber,
      createdAt: savedInvoice.createdAt
    });

  } catch (error) {
    console.error('Error saving invoice:', error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'Invoice number already exists'
      });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to save invoice',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get invoice by invoice number
app.get('/api/invoices/:invoiceNumber', async (req, res) => {
  try {
    const { invoiceNumber } = req.params;

    const invoice = await Invoice.findOne({ invoiceNumber });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    res.json({
      success: true,
      invoice: invoice
    });

  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch invoice',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get all invoices (with pagination)
app.get('/api/invoices', async (req, res) => {
  try {
    const { limit = 50, skip = 0, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const invoices = await Invoice.find()
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .select('-dynamicQRCode'); // Exclude large QR code data for list view

    const total = await Invoice.countDocuments();

    res.json({
      success: true,
      invoices: invoices,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: parseInt(skip) + parseInt(limit) < total
      }
    });

  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch invoices',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Delete invoice
app.delete('/api/invoices/:invoiceNumber', async (req, res) => {
  try {
    const { invoiceNumber } = req.params;

    const deletedInvoice = await Invoice.findOneAndDelete({ invoiceNumber });

    if (!deletedInvoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    res.json({
      success: true,
      message: 'Invoice deleted successfully',
      deletedInvoice: {
        id: deletedInvoice._id,
        invoiceNumber: deletedInvoice.invoiceNumber
      }
    });

  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete invoice',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed.');
    process.exit(0);
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 API Base URL: http://localhost:${PORT}/api`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;