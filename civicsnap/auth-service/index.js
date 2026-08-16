const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const path = require('path');
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config();

const app = express();
const PORT = process.env.AUTH_SERVICE_PORT || 4000;

const connectionString = process.env.DATABASE_URL || process.env.DB_URL || 'postgresql://postgres:NCK7HMjpePfy6l83@db.spxihllztqedtitwlsdw.supabase.co:5432/postgres';

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    service: 'CivicSnap Auth Service',
    status: 'online',
    stage: 'Stage 1 — Project Scaffolding & Database'
  });
});

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
        service: 'Express Auth Service'
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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Auth Service listening on port ${PORT}`);
});
