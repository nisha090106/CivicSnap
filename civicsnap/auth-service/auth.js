const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config();

const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_civicsnap_2026';
const connectionString = process.env.DATABASE_URL || process.env.DB_URL;

const pool = new Pool({
  connectionString: connectionString,
  ssl: { rejectUnauthorized: false }
});

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
