const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_civicsnap_2026';
const connectionString = process.env.DATABASE_URL || process.env.DB_URL;

let activePool = new Pool({
  connectionString: connectionString,
  ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000
});
let sslDisabled = process.env.DB_SSL === 'false';

function switchSslOff() {
  if (!sslDisabled) {
    console.warn('[AUTH-DB] PostgreSQL server does not support SSL mode. Switching pool to ssl: false...');
    sslDisabled = true;
    activePool.end().catch(() => {});
    activePool = new Pool({
      connectionString: connectionString,
      ssl: false,
      connectionTimeoutMillis: 10000
    });
  }
}

const pool = {
  async query(text, params) {
    try {
      return await activePool.query(text, params);
    } catch (err) {
      if (err.message && err.message.includes('does not support SSL')) {
        switchSslOff();
        return await activePool.query(text, params);
      }
      throw err;
    }
  },
  async connect() {
    try {
      return await activePool.connect();
    } catch (err) {
      if (err.message && err.message.includes('does not support SSL')) {
        switchSslOff();
        return await activePool.connect();
      }
      throw err;
    }
  },
  on(event, handler) {
    return activePool.on(event, handler);
  },
  end() {
    return activePool.end();
  }
};

// Helper: Generate JWT token for a user
function generateToken(user) {
  const payload = {
    sub: user.id,
    id: user.id,
    name: user.name,
    email: user.email || null,
    phoneNumber: user.phoneNumber || null,
    role: user.role || 'citizen',
    department: user.department || null,
    isApproved: user.isApproved ?? true,
    iss: 'civicsnap-auth-service'
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

// Helper: Verify JWT token
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

module.exports = {
  pool,
  JWT_SECRET,
  generateToken,
  verifyToken
};