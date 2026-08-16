const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres.spxihllztqedtitwlsdw:NCK7HMjpePfy6l83@aws-0-ap-south-1.pooler.supabase.com:5432/postgres';

const pool = new Pool({
  connectionString: connectionString,
  ssl: { rejectUnauthorized: false }
});

async function createTables() {
  console.log('Initializing Better Auth database tables in Supabase...');
  const client = await pool.connect();

  try {
    // 1. User table with custom role, department, isApproved fields
    await client.query(`
      CREATE TABLE IF NOT EXISTS "user" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT NOT NULL,
        "email" TEXT UNIQUE,
        "emailVerified" BOOLEAN NOT NULL DEFAULT false,
        "image" TEXT,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "role" TEXT NOT NULL DEFAULT 'citizen',
        "department" TEXT,
        "isApproved" BOOLEAN NOT NULL DEFAULT true,
        "phoneNumber" TEXT UNIQUE,
        "phoneNumberVerified" BOOLEAN DEFAULT false
      );
    `);
    console.log('✔ Table "user" created / verified.');

    // Add columns if table already existed without them
    await client.query(`
      ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'citizen';
      ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "department" TEXT;
      ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "isApproved" BOOLEAN NOT NULL DEFAULT true;
      ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "phoneNumber" TEXT UNIQUE;
      ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "phoneNumberVerified" BOOLEAN DEFAULT false;
    `);

    // 2. Session table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "session" (
        "id" TEXT PRIMARY KEY,
        "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "token" TEXT NOT NULL UNIQUE,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "ipAddress" TEXT,
        "userAgent" TEXT,
        "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
      );
    `);
    console.log('✔ Table "session" created / verified.');

    // 3. Account table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "account" (
        "id" TEXT PRIMARY KEY,
        "accountId" TEXT NOT NULL,
        "providerId" TEXT NOT NULL,
        "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "accessToken" TEXT,
        "refreshToken" TEXT,
        "idToken" TEXT,
        "accessTokenExpiresAt" TIMESTAMP WITH TIME ZONE,
        "refreshTokenExpiresAt" TIMESTAMP WITH TIME ZONE,
        "scope" TEXT,
        "password" TEXT,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);
    console.log('✔ Table "account" created / verified.');

    // 4. Verification table (for OTP & verification codes)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "verification" (
        "id" TEXT PRIMARY KEY,
        "identifier" TEXT NOT NULL,
        "value" TEXT NOT NULL,
        "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✔ Table "verification" created / verified.');

    console.log('✅ All Better Auth database tables successfully setup in Supabase PostgreSQL!');
  } catch (err) {
    console.error('❌ Error setting up auth tables:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

createTables();
