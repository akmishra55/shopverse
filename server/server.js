
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');

const connectDB = require('./config/db');
const { apiLimiter } = require('./middleware/rateLimiter');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const paymentController = require('./controllers/paymentController');

const app = express();
app.set('trust proxy', 1); // correct client IPs behind Docker/nginx

/* ---------- Security & parsing middleware ---------- */
app.use(helmet());
app.use(cors({
  origin: (process.env.CLIENT_URL || 'http://localhost:5173').split(','),
  credentials: true, // required so the httpOnly refresh cookie flows
}));

// ⚠️ Stripe webhook needs the RAW body for signature verification —
// it must be registered BEFORE express.json().
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }), paymentController.stripeWebhook);

app.use(express.json({ limit: '10kb' })); // cap payload size
app.use(cookieParser());
app.use(mongoSanitize()); // strips $ and . from keys → NoSQL-injection defense
app.use(morgan('dev'));

/* ---------- Routes ---------- */
app.use('/api', apiLimiter);
app.get('/api/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));
app.get('/api/config', paymentController.getPublicConfig);
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));

app.use(notFound);
app.use(errorHandler);

/* ---------- Boot ---------- */
const PORT = process.env.PORT || 5000;
(async () => {
  await connectDB();
  if (process.env.SEED_ON_START === 'true') {
    await require('./seed/seed')();
  }
  app.listen(PORT, () => console.log(`🚀 ShopVerse API running on http://localhost:${PORT}`));
})();
