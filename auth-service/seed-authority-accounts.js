/**
 * seed-authority-accounts.js
 *
 * One-time seed script: creates seven pre-approved authority accounts in Supabase.
 *
 * Passwords are read from environment variables — NEVER hardcoded here.
 * Run this from the auth-service directory:
 *
 *   node seed-authority-accounts.js
 *
 * Requires the following env vars (set in root .env or exported in shell):
 *   ROAD_TRANSPORT_PASSWORD, GARBAGE_WASTE_PASSWORD, FOOD_DRUG_PASSWORD,
 *   FOREST_DEPT_PASSWORD, MUNICIPAL_PASSWORD, NAGAR_PANCHAYAT_PASSWORD,
 *   GRAM_PANCHAYAT_PASSWORD
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config(); // fallback to local .env if present

const { randomBytes, scrypt } = require('node:crypto');
const { pool } = require('./auth');

// ─── Scrypt config matching @better-auth/utils/password exactly ───────────────
const SCRYPT_CONFIG = { N: 16384, r: 16, p: 1, dkLen: 64 };

function generateKey(password, salt) {
  return new Promise((resolve, reject) => {
    scrypt(
      password.normalize('NFKC'),
      salt,
      SCRYPT_CONFIG.dkLen,
      {
        N: SCRYPT_CONFIG.N,
        r: SCRYPT_CONFIG.r,
        p: SCRYPT_CONFIG.p,
        maxmem: 128 * SCRYPT_CONFIG.N * SCRYPT_CONFIG.r * 2
      },
      (err, key) => {
        if (err) reject(err);
        else resolve(key);
      }
    );
  });
}

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const key = await generateKey(password, salt);
  return `${salt}:${key.toString('hex')}`;
}

// ─── Department definitions ────────────────────────────────────────────────────
const DEPARTMENTS = [
  {
    department: 'Road & Transport',
    email: 'roadtransport@civicsnap.gov.in',
    name: 'Road & Transport Authority',
    envVar: 'ROAD_TRANSPORT_PASSWORD',
  },
  {
    department: 'Garbage & Waste Management',
    email: 'garbagewaste@civicsnap.gov.in',
    name: 'Garbage & Waste Management Authority',
    envVar: 'GARBAGE_WASTE_PASSWORD',
  },
  {
    department: 'Food & Drug Authority',
    email: 'fooddrug@civicsnap.gov.in',
    name: 'Food & Drug Authority',
    envVar: 'FOOD_DRUG_PASSWORD',
  },
  {
    department: 'Forest Department',
    email: 'forest@civicsnap.gov.in',
    name: 'Forest Department',
    envVar: 'FOREST_DEPT_PASSWORD',
  },
  {
    department: 'Municipal Corporation',
    email: 'municipal@civicsnap.gov.in',
    name: 'Municipal Corporation',
    envVar: 'MUNICIPAL_PASSWORD',
  },
  {
    department: 'Nagar Panchayat',
    email: 'nagarpanchayat@civicsnap.gov.in',
    name: 'Nagar Panchayat',
    envVar: 'NAGAR_PANCHAYAT_PASSWORD',
  },
  {
    department: 'Gram Panchayat',
    email: 'grampanchayat@civicsnap.gov.in',
    name: 'Gram Panchayat',
    envVar: 'GRAM_PANCHAYAT_PASSWORD',
  },
];

// ─── Validate all required env vars up-front ──────────────────────────────────
function validateEnvVars() {
  const missing = [];
  for (const dept of DEPARTMENTS) {
    if (!process.env[dept.envVar]) {
      missing.push(dept.envVar);
    }
  }
  if (missing.length > 0) {
    console.error('\n❌  SEED FAILED — Missing required environment variables:');
    for (const v of missing) {
      console.error(`    • ${v}`);
    }
    console.error('\nSet these in your .env file or shell before running the seed.\n');
    process.exit(1);
  }
}

// ─── Detect password uniqueness ───────────────────────────────────────────────
function checkPasswordUniqueness() {
  const passwords = DEPARTMENTS.map(d => ({
    envVar: d.envVar,
    value: process.env[d.envVar],
  }));
  const seen = new Map();
  let hasDuplicates = false;
  for (const { envVar, value } of passwords) {
    if (seen.has(value)) {
      console.error(
        `❌  SEED FAILED — Duplicate password detected: ${envVar} has the same value as ${seen.get(value)}.`
      );
      hasDuplicates = true;
    }
    seen.set(value, envVar);
  }
  if (hasDuplicates) {
    console.error('All seven departments must have distinct passwords.\n');
    process.exit(1);
  }
}

// ─── Seed a single authority account ──────────────────────────────────────────
async function seedAccount({ department, email, name, envVar }) {
  const password = process.env[envVar];
  const hashedPassword = await hashPassword(password);

  const userId = `usr_seed_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const accountId = `acc_seed_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  // Upsert user row
  const userRes = await pool.query(
    `INSERT INTO "user" (
       "id", "name", "email", "emailVerified",
       "role", "department", "isApproved", "createdAt", "updatedAt"
     )
     VALUES ($1, $2, $3, true, 'authority', $4, true, NOW(), NOW())
     ON CONFLICT ("email") DO UPDATE
       SET "name"       = EXCLUDED."name",
           "role"       = 'authority',
           "department" = EXCLUDED."department",
           "isApproved" = true,
           "updatedAt"  = NOW()
     RETURNING "id", "email", "department", "isApproved"`,
    [userId, name, email, department]
  );
  const user = userRes.rows[0];

  // Upsert account row (credential provider — this is where the password hash lives)
  // The account table only has a PK on id — so we delete first then re-insert for idempotency
  await pool.query(
    `DELETE FROM "account" WHERE "userId" = $1 AND "providerId" = 'credential'`,
    [user.id]
  );
  await pool.query(
    `INSERT INTO "account" (
       "id", "accountId", "providerId",
       "userId", "password", "createdAt", "updatedAt"
     )
     VALUES ($1, $2, 'credential', $3, $4, NOW(), NOW())`,
    [accountId, email, user.id, hashedPassword]
  );

  return user;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🌱  CivicSnap — Authority Account Seed Script');
  console.log('═══════════════════════════════════════════════\n');

  validateEnvVars();
  checkPasswordUniqueness();

  console.log('✅  All environment variables present and unique.\n');
  console.log('Connecting to Supabase and seeding accounts...\n');

  const results = [];
  for (const dept of DEPARTMENTS) {
    try {
      process.stdout.write(`  • ${dept.name.padEnd(40)} `);
      const user = await seedAccount(dept);
      results.push({ ...dept, userId: user.id, success: true });
      console.log(`✓  id=${user.id}`);
    } catch (err) {
      results.push({ ...dept, success: false, error: err.message });
      console.error(`✗  ERROR: ${err.message}`);
    }
  }

  console.log('\n═══════════════════════════════════════════════');
  const succeeded = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  console.log(`Seed complete: ${succeeded} succeeded, ${failed} failed.\n`);

  if (failed > 0) {
    console.error('Failed accounts:');
    results.filter(r => !r.success).forEach(r => {
      console.error(`  • ${r.name}: ${r.error}`);
    });
    process.exit(1);
  }

  // Verification — confirm all 7 rows in the DB
  console.log('\n📋  Verifying seeded accounts in database:\n');
  const emails = DEPARTMENTS.map(d => d.email);
  const verifyRes = await pool.query(
    `SELECT u."email", u."department", u."isApproved", a."providerId"
     FROM "user" u
     LEFT JOIN "account" a ON a."userId" = u."id" AND a."providerId" = 'credential'
     WHERE u."email" = ANY($1::text[])
     ORDER BY u."department"`,
    [emails]
  );

  if (verifyRes.rows.length === 7) {
    for (const row of verifyRes.rows) {
      const approved = row.isApproved ? '✓ approved' : '✗ pending';
      const creds = row.providerId === 'credential' ? '✓ password set' : '✗ NO CREDENTIAL';
      console.log(`  ${row.email.padEnd(45)} dept=${row.department.padEnd(30)} ${approved}  ${creds}`);
    }
    console.log('\n✅  All 7 authority accounts verified in Supabase.\n');
  } else {
    console.error(
      `\n⚠️   Expected 7 rows in verify query, found ${verifyRes.rows.length}. Please re-run the seed.\n`
    );
    process.exit(1);
  }

  await pool.end();
}

main().catch(err => {
  console.error('\nUnhandled error in seed script:', err);
  process.exit(1);
});
