require('dotenv').config();
const express = require('express');
const dotenv = require('dotenv');
const dataRoutes = require('./routes/dataRoutes');

// server.js
const cors = require('cors');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  process.env.FRONTEND_ORIGIN,
  'https://rfpramos.github.io',
  /^https:\/\/.*\.vercel\.app$/,
].filter(Boolean);

// Allow requests from your frontend and local development.
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    const isAllowed = allowedOrigins.some((allowedOrigin) => {
      if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }

      return allowedOrigin === origin;
    });

    callback(isAllowed ? null : new Error('Not allowed by CORS'), isAllowed);
  },
}));
app.use(express.json());

// Simple request logger for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Fast health check route that does not touch the database.
app.get('/api/health', (req, res) => {
  res.status(200).json({
    ok: true,
    service: 'backend',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api', dataRoutes);

// Error handler (captures thrown errors from routes)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err && err.stack ? err.stack : err);
  res.status(500).json({ error: 'Internal Server Error', details: err && err.message ? err.message : String(err) });
});

// Local development only; Vercel serverless must not call app.listen().
if (require.main === module) {
  const HOST = process.env.HOST || '0.0.0.0';
  app.listen(PORT, HOST, () => {
    console.log(`Server is running on http://${HOST}:${PORT}`);
  });
}

module.exports = app;
