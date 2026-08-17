/**
 * test-email-signin.js
 * Quick smoke-test for the /api/auth/email/signin endpoint.
 * Tests 2 departments + a bad-password rejection.
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config();

const AUTH_URL = process.env.AUTH_URL || `http://localhost:4000`;

async function post(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return { status: res.status, data: await res.json() };
}

async function main() {
  const tests = [
    {
      label: 'Road & Transport login',
      email: 'roadtransport@civicsnap.gov.in',
      password: process.env.ROAD_TRANSPORT_PASSWORD,
      expectSuccess: true,
      expectedDept: 'Road & Transport'
    },
    {
      label: 'Municipal Corporation login',
      email: 'municipal@civicsnap.gov.in',
      password: process.env.MUNICIPAL_PASSWORD,
      expectSuccess: true,
      expectedDept: 'Municipal Corporation'
    },
    {
      label: 'Wrong password rejection',
      email: 'forest@civicsnap.gov.in',
      password: 'WRONG_PASSWORD_123',
      expectSuccess: false
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const t of tests) {
    try {
      const { status, data } = await post(`${AUTH_URL}/api/auth/sign-in/email`, {
        email: t.email,
        password: t.password
      });

      if (t.expectSuccess) {
        if (data.success && data.user && data.user.department === t.expectedDept && data.user.isApproved) {
          console.log(`  ✅  PASS  ${t.label}`);
          console.log(`       user.id=${data.user.id}  dept=${data.user.department}  approved=${data.user.isApproved}`);
          passed++;
        } else {
          console.error(`  ❌  FAIL  ${t.label}`);
          console.error(`       HTTP ${status}  response=`, JSON.stringify(data));
          failed++;
        }
      } else {
        if (!data.success && status === 401) {
          console.log(`  ✅  PASS  ${t.label} (correctly rejected)`);
          passed++;
        } else {
          console.error(`  ❌  FAIL  ${t.label} — expected 401 rejection, got HTTP ${status}`);
          console.error(`       response=`, JSON.stringify(data));
          failed++;
        }
      }
    } catch (err) {
      console.error(`  ❌  ERROR  ${t.label}:`, err.message);
      failed++;
    }
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed.\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
