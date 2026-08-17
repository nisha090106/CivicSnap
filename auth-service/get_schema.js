const { pool } = require('./auth');

async function main() {
  try {
    // Check constraints on the account table
    const res = await pool.query(`
      SELECT conname, contype, pg_get_constraintdef(oid) AS definition
      FROM pg_constraint
      WHERE conrelid = 'account'::regclass
    `);
    console.log('ACCOUNT TABLE CONSTRAINTS:');
    res.rows.forEach(r => {
      console.log(`  ${r.contype} [${r.conname}]: ${r.definition}`);
    });

    // Also check indexes
    const idx = await pool.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'account'
    `);
    console.log('\nACCOUNT TABLE INDEXES:');
    idx.rows.forEach(r => console.log(`  ${r.indexname}: ${r.indexdef}`));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
main();
