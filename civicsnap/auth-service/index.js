const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const path = require('path');
const express = require('express');
const cors = require('cors');
const { crypto } = require('crypto');
const { pool, generateToken, verifyToken } = require('./auth');

const app = express();
const PORT = process.env.AUTH_SERVICE_PORT || 4000;

app.use(cors());
app.use(express.json());

// In-memory OTP storage for rapid verification
const otpStore = new Map();

// 1. Health Check Endpoint
app.get('/health', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT 1 as connected');
    client.release();
    
    if (result.rows[0].connected === 1) {
      return res.status(200).json({
        status: 'healthy',
        database: 'connected',
        message: 'Auth Service connected to Supabase PostgreSQL',
        service: 'Express Auth Service (Better Auth Provider)'
      });
    } else {
      throw new Error('Database query returned unexpected result');
    }
  } catch (error) {
    return res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      service: 'Express Auth Service'
    });
  }
});

// 2. Phone OTP - Step 1: Send OTP
app.post('/api/auth/phone/send-otp', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

    otpStore.set(phoneNumber, { code: otpCode, expiresAt });

    // Save/Upsert verification record in database
    await pool.query(
      `INSERT INTO "verification" ("id", "identifier", "value", "expiresAt", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, to_timestamp($4), NOW(), NOW())
       ON CONFLICT ("id") DO UPDATE SET "value" = $3, "expiresAt" = to_timestamp($4), "updatedAt" = NOW()`,
      [`otp_${phoneNumber}`, phoneNumber, otpCode, expiresAt / 1000]
    );

    console.log(`=================================================`);
    console.log(`[BETTER-AUTH PHONE OTP STUB] Phone: ${phoneNumber}`);
    console.log(`[BETTER-AUTH PHONE OTP STUB] Verification Code: ${otpCode}`);
    console.log(`=================================================`);

    return res.status(200).json({
      success: true,
      message: 'OTP code generated and logged to console',
      phoneNumber,
      otpCode // Included in response for developer convenience
    });
  } catch (err) {
    console.error('Error in send-otp:', err);
    return res.status(500).json({ error: 'Failed to send OTP', details: err.message });
  }
});

// 3. Phone OTP - Step 2: Verify OTP & Sign In / Register User
app.post('/api/auth/phone/verify-otp', async (req, res) => {
  try {
    const { phoneNumber, code, role = 'citizen', department = null, name } = req.body;

    if (!phoneNumber || !code) {
      return res.status(400).json({ error: 'Phone number and OTP code are required' });
    }

    // Verify OTP code
    const cached = otpStore.get(phoneNumber);
    let isValid = false;

    if (cached && cached.code === code && cached.expiresAt > Date.now()) {
      isValid = true;
    } else {
      // Check database verification record
      const dbRes = await pool.query(
        `SELECT * FROM "verification" WHERE "identifier" = $1 AND "value" = $2 AND "expiresAt" > NOW()`,
        [phoneNumber, code]
      );
      if (dbRes.rows.length > 0) {
        isValid = true;
      }
    }

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid or expired OTP verification code' });
    }

    // Determine initial user settings
    const isCitizen = role === 'citizen';
    const isApproved = isCitizen ? true : false; // Default false for authorities, true for citizens
    const userName = name || (isCitizen ? `Citizen (${phoneNumber.slice(-4)})` : `Officer (${phoneNumber.slice(-4)})`);
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Upsert User in database
    const userRes = await pool.query(
      `INSERT INTO "user" ("id", "name", "phoneNumber", "phoneNumberVerified", "role", "department", "isApproved", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, true, $4, $5, $6, NOW(), NOW())
       ON CONFLICT ("phoneNumber") DO UPDATE 
       SET "role" = EXCLUDED."role",
           "department" = COALESCE(EXCLUDED."department", "user"."department"),
           "updatedAt" = NOW()
       RETURNING *`,
      [userId, userName, phoneNumber, role, department, isApproved]
    );

    const user = userRes.rows[0];
    const token = generateToken(user);

    // Clean up OTP
    otpStore.delete(phoneNumber);

    return res.status(200).json({
      success: true,
      message: 'Authentication successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        phoneNumber: user.phoneNumber,
        role: user.role,
        department: user.department,
        isApproved: user.isApproved
      }
    });
  } catch (err) {
    console.error('Error in verify-otp:', err);
    return res.status(500).json({ error: 'OTP Verification failed', details: err.message });
  }
});

// 4. Google OAuth Sign-In Simulation Endpoint
app.post('/api/auth/google/signin', async (req, res) => {
  try {
    const { email, name, role = 'citizen', department = null, googleId } = req.body;
    
    const userEmail = email || `user_${Date.now()}@google.com`;
    const userName = name || 'Google User';
    const isCitizen = role === 'citizen';
    const isApproved = isCitizen ? true : false;
    const userId = `usr_g_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Upsert User in database
    const userRes = await pool.query(
      `INSERT INTO "user" ("id", "name", "email", "emailVerified", "role", "department", "isApproved", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, true, $4, $5, $6, NOW(), NOW())
       ON CONFLICT ("email") DO UPDATE 
       SET "role" = EXCLUDED."role",
           "department" = COALESCE(EXCLUDED."department", "user"."department"),
           "updatedAt" = NOW()
       RETURNING *`,
      [userId, userName, userEmail, role, department, isApproved]
    );

    const user = userRes.rows[0];
    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Google Sign-in successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        isApproved: user.isApproved
      }
    });
  } catch (err) {
    console.error('Error in google sign-in:', err);
    return res.status(500).json({ error: 'Google sign-in failed', details: err.message });
  }
});

// 5. Current User / Verify Token Endpoint
app.get('/api/auth/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization bearer token required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ error: 'Invalid or expired session token' });
    }

    // Fetch latest user state from database
    const userRes = await pool.query(`SELECT * FROM "user" WHERE "id" = $1`, [decoded.id]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User record not found' });
    }

    const user = userRes.rows[0];
    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        department: user.department,
        isApproved: user.isApproved
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to verify session', details: err.message });
  }
});

// 6. Admin / Dev Helper: Approve Pending Authority Account
app.post('/api/auth/approve-authority', async (req, res) => {
  try {
    const { userId, phoneNumber } = req.body;
    let query = `UPDATE "user" SET "isApproved" = true WHERE "id" = $1 RETURNING *`;
    let params = [userId];

    if (!userId && phoneNumber) {
      query = `UPDATE "user" SET "isApproved" = true WHERE "phoneNumber" = $1 RETURNING *`;
      params = [phoneNumber];
    }

    const userRes = await pool.query(query, params);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userRes.rows[0];
    const newToken = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Authority account approved successfully!',
      token: newToken,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        department: user.department,
        isApproved: user.isApproved
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Approval failed', details: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Auth Service (Better Auth Provider) listening on port ${PORT}`);
});
