const http = require('http');
const fs = require('fs');

let output = '';
function log(msg) { output += msg + '\n'; console.log(msg); }

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: '127.0.0.1',
      port: 4000,
      path,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, (res) => {
      let chunks = '';
      res.on('data', c => chunks += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(chunks) }); }
        catch { resolve({ status: res.statusCode, data: chunks }); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  log('Test 1: Road & Transport login (correct password)');
  try {
    const r1 = await post('/api/auth/sign-in/email', { email: 'roadtransport@civicsnap.gov.in', password: 'RdTr@Civic#2026' });
    log('  Status: ' + r1.status);
    log('  Success: ' + (r1.data.success || false));
    log('  Department: ' + (r1.data.user ? r1.data.user.department : 'N/A'));
    log('  Approved: ' + (r1.data.user ? r1.data.user.isApproved : 'N/A'));
    log('  Token: ' + (r1.data.token ? r1.data.token.substring(0, 20) + '...' : 'N/A'));
  } catch(e) { log('  Error: ' + e.message); }

  log('');
  log('Test 2: Municipal Corporation login (correct password)');
  try {
    const r2 = await post('/api/auth/sign-in/email', { email: 'municipal@civicsnap.gov.in', password: 'Mnpl@Civic#2026' });
    log('  Status: ' + r2.status);
    log('  Success: ' + (r2.data.success || false));
    log('  Department: ' + (r2.data.user ? r2.data.user.department : 'N/A'));
    log('  Approved: ' + (r2.data.user ? r2.data.user.isApproved : 'N/A'));
  } catch(e) { log('  Error: ' + e.message); }

  log('');
  log('Test 3: Wrong password (should be rejected HTTP 401)');
  try {
    const r3 = await post('/api/auth/sign-in/email', { email: 'forest@civicsnap.gov.in', password: 'WRONG_PASSWORD' });
    log('  Status: ' + r3.status);
    log('  Rejected: ' + (r3.status === 401));
    log('  Error msg: ' + (r3.data.error || 'N/A'));
  } catch(e) { log('  Error: ' + e.message); }

  fs.writeFileSync('test-results.txt', output, 'utf8');
  log('\nDone. Results saved to test-results.txt');
}

main();
