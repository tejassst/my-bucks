const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult, param } = require('express-validator');
const morgan = require('morgan');
const winston = require('winston');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const auth = require('./middleware/auth');
require('dotenv').config();
const Transaction = require('./models/Transaction.js');

const app = express();

// Configure Winston logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// Add console transport for non-production
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}

// Database connection with proper error handling
let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    return;
  }

  try {
    const mongoUrl = process.env.MONGO_URL;
    if (!mongoUrl) {
      throw new Error('MONGO_URL environment variable is not set');
    }

    await mongoose.connect(mongoUrl);

    isConnected = true;
    logger.info('Connected to MongoDB successfully');
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    throw error;
  }
};

// Initialize database connection
connectDB().catch((error) => {
  logger.error('Failed to initialize database connection:', error);
  process.exit(1);
});

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// CORS configuration
const corsOptions = {
  origin: ['https://my-bucks.vercel.app', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use('/api/transaction', auth);
app.use('/api/transactions', auth);

// Logging middleware
app.use(
  morgan('combined', {
    stream: { write: (message) => logger.info(message.trim()) },
  })
);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database:
      mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ body: 'test ok', timestamp: new Date().toISOString() });
});

app.post('/api/auth/signup', async (req, res) => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    const { email, password } = req.body;

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
    });

    res.json({ message: 'User created', userId: user._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'User not found' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: 'Invalid password' });

    // Create JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' } // token expires in 1 hour
    );

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Validation middleware
const validateTransaction = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('price')
    .isNumeric()
    .withMessage('Price must be a valid number')
    .custom((value) => {
      if (Math.abs(value) > 1000000) {
        throw new Error('Price must be less than 1,000,000');
      }
      return true;
    }),
  body('datetime')
    .isISO8601()
    .withMessage('Datetime must be a valid ISO 8601 date'),
];

const validateObjectId = [
  param('id').isMongoId().withMessage('Invalid transaction ID format'),
];

// Error handling middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array(),
    });
  }
  next();
};

// Transaction endpoints
app.post(
  '/api/transaction',
  auth,
  validateTransaction,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { name, description, datetime, price } = req.body;

      // Extra validation for price and datetime
      const parsedPrice = Number(price);
      if (isNaN(parsedPrice)) {
        return res.status(400).json({ error: 'Price must be a valid number' });
      }
      const parsedDate = new Date(datetime);
      if (isNaN(parsedDate.getTime())) {
        return res
          .status(400)
          .json({ error: 'Datetime must be a valid ISO 8601 date' });
      }

      const transaction = await Transaction.create({
        name: name.trim(),
        description: description?.trim() || '',
        datetime: parsedDate,
        price: parsedPrice,
        userId: req.user.userId,
      });

      logger.info(`Transaction created: ${transaction._id}`);
      res.status(201).json(transaction);
    } catch (error) {
      logger.error('Error creating transaction:', error);
      res
        .status(500)
        .json({ error: 'Error adding transaction. Please try again.' });
    }
  }
);

app.get('/api/transactions', auth, async (req, res) => {
  try {
    const { sort = 'latest', limit = 100, offset = 0 } = req.query;

    // Validate sort parameter
    const allowedSorts = ['latest', 'oldest', 'highest', 'lowest'];
    if (!allowedSorts.includes(sort)) {
      return res.status(400).json({ error: 'Invalid sort parameter' });
    }

    // Validate pagination parameters
    const limitNum = Math.min(parseInt(limit) || 100, 1000); // Max 1000 results
    const offsetNum = Math.max(parseInt(offset) || 0, 0);

    let sortOptions = {};
    switch (sort) {
      case 'latest':
        sortOptions = { datetime: -1 };
        break;
      case 'oldest':
        sortOptions = { datetime: 1 };
        break;
      case 'highest':
        sortOptions = { price: -1 };
        break;
      case 'lowest':
        sortOptions = { price: 1 };
        break;
    }

    const transactions = await Transaction.find({ userId: req.user.userId })
      .sort(sortOptions)
      .limit(limitNum)
      .skip(offsetNum);

    const total = await Transaction.countDocuments({ userId: req.user.userId });

    res.json({
      transactions,
      pagination: {
        total,
        limit: limitNum,
        offset: offsetNum,
        hasMore: offsetNum + limitNum < total,
      },
    });
  } catch (error) {
    logger.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

app.delete(
  '/api/transaction/:id',
  auth,
  validateObjectId,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { id } = req.params;

      const deletedTransaction = await Transaction.findOneAndDelete({
        _id: id,
        userId: req.user.userId,
      });

      if (!deletedTransaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      logger.info(`Transaction deleted: ${id}`);
      res.json({ success: true, deleted: deletedTransaction });
    } catch (error) {
      logger.error('Error deleting transaction:', error);
      res.status(500).json({ error: 'Failed to delete transaction' });
    }
  }
);

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// API-only backend - frontend is deployed separately as static site
app.get('*', (req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

const port = process.env.PORT || 4040;

const server = app.listen(port, () => {
  logger.info(`Server running on http://localhost:${port}`);
  logger.info(`API endpoints available at http://localhost:${port}/api`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(async () => {
    logger.info('HTTP server closed');
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(async () => {
    logger.info('HTTP server closed');
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
    process.exit(0);
  });
});
