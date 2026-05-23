const pool = require('./db');

pool.query('SELECT 1+1 AS sum', (err, results) => {
  if (err) {
    console.error('DB connection test failed:', err.message || err);
    process.exit(1);
  }
  console.log('DB connection test succeeded:', results[0]);
  pool.end(() => process.exit(0));
});
