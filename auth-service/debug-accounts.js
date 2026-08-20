const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const { pool } = require('./auth');
const fs = require('fs');

async function main() {
  const userRes = await pool.query(
    `SELECT u."id", u."email", u."department", u."isApproved", u."role", a."providerId", a."accountId", LENGTH(a."password") as pwd_len
     FROM "user" u 
     LEFT JOIN "account" a ON a."userId" = u."id"
     WHERE u."role" = 'authority'
     ORDER BY u."department"`
  );
  let out = 'Authority accounts in DB:\n';
  userRes.rows.forEach(r => {
    out += `  id=${r.id} | email=${r.email} | dept=${r.department} | approved=${r.isApproved} | provider=${r.providerId} | accountId=${r.accountId} | pwd_len=${r.pwd_len}\n`;
  });
  
  // Also check if there's a unique constraint on email
  const cRes = await pool.query(`
    SELECT conname, pg_get_constraintdef(oid) AS definition
    FROM pg_constraint
    WHERE conrelid = '"user"'::regclass
  `);
  out += '\nUser table constraints:\n';
  cRes.rows.forEach(r => out += `  ${r.conname}: ${r.definition}\n`);

  const idxRes = await pool.query(`
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE tablename = 'user'
  `);
  out += '\nUser table indexes:\n';
  idxRes.rows.forEach(r => out += `  ${r.indexname}: ${r.indexdef}\n`);

  fs.writeFileSync('debug-output.txt', out, 'utf8');
  console.log(out);
  console.log('Saved to debug-output.txt');
  await pool.end();
}
main();
