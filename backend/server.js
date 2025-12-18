const express = require('express');
const dotenv = require('dotenv');
const dataRoutes = require('./routes/dataRoutes');

const cors = require('cors');


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Simple request logger for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use('/api', dataRoutes);

// Error handler (captures thrown errors from routes)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err && err.stack ? err.stack : err);
  res.status(500).json({ error: 'Internal Server Error', details: err && err.message ? err.message : String(err) });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
