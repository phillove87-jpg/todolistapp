const db = require('./src/db/dbClient');
const config = require('./src/config/env');

async function testConnection() {
  try {
    console.log('Testing with config:', { ...config.db, password: '***' });
    console.log('Password type:', typeof config.db.password);
    const res = await db.query('SELECT NOW()');
    console.log('Database connection successful:', res.rows[0].now);
    process.exit(0);
  } catch (err) {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  }
}

testConnection();
