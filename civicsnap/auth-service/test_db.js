const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:NCK7HMjpePfy6l83@db.spxihllztqedtitwlsdw.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  console.log('Connecting to Supabase PostgreSQL...');
  const client = await pool.connect();
  const res = await client.query('SELECT 1 as connected');
  console.log('SUCCESS! Query result:', res.rows[0]);

  // Create reports table
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS reports (
      report_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      citizen_id UUID NULL,
      image_url TEXT NULL,
      category VARCHAR(100) NULL,
      latitude FLOAT NULL,
      longitude FLOAT NULL,
      description TEXT NULL,
      department VARCHAR(100) NULL,
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      vote_count INTEGER DEFAULT 0
    );
  `;
  await client.query(createTableQuery);
  console.log('SUCCESS! reports table created / verified in Supabase PostgreSQL.');

  const cols = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'reports';
  `);
  console.log('reports table column schema:');
  cols.rows.forEach(r => console.log(' -', r.column_name, ':', r.data_type));

  client.release();
  await pool.end();
}

main().catch(err => {
  console.error('Database connection error:', err);
  process.exit(1);
});
