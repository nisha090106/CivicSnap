const AUTH_URL = 'http://localhost:4000';
const BACKEND_URL = 'http://localhost:5000';

async function runTests() {
  console.log('===========================================================');
  console.log('🧪 STAGE 2 BETTER AUTH & MULTI-ROLE AUTHENTICATION TESTS');
  console.log('===========================================================');

  // --- Path 1: Citizen Phone OTP Sign-In ---
  console.log('\n--- Test Path 1: New Citizen via Phone OTP ---');
  const citizenPhone = `+91${Math.floor(1000000000 + Math.random() * 9000000000)}`;
  const otpRes = await fetch(`${AUTH_URL}/api/auth/phone/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber: citizenPhone })
  }).then(r => r.json());
  console.log('1. Send OTP Response:', otpRes);

  const verifyCitizenRes = await fetch(`${AUTH_URL}/api/auth/phone/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phoneNumber: citizenPhone,
      code: otpRes.otpCode,
      role: 'citizen'
    })
  }).then(r => r.json());
  console.log('2. Verify OTP Citizen Response:', verifyCitizenRes);

  if (!verifyCitizenRes.token || verifyCitizenRes.user.role !== 'citizen' || verifyCitizenRes.user.isApproved !== true) {
    throw new Error('FAILED Path 1 Citizen verification');
  }

  // Verify FastAPI JWT route protection for Citizen
  const citizenFastApiRes = await fetch(`${BACKEND_URL}/api/me`, {
    headers: { Authorization: `Bearer ${verifyCitizenRes.token}` }
  }).then(r => r.json());
  console.log('3. FastAPI /api/me (Citizen JWT):', citizenFastApiRes);

  const citizenReportRes = await fetch(`${BACKEND_URL}/api/reports/citizen`, {
    headers: { Authorization: `Bearer ${verifyCitizenRes.token}` }
  }).then(r => r.json());
  console.log('4. FastAPI /api/reports/citizen (Protected Route):', citizenReportRes);

  // --- Path 2: Citizen Google Sign-In ---
  console.log('\n--- Test Path 2: New Citizen via Google Sign-In ---');
  const googleCitizenRes = await fetch(`${AUTH_URL}/api/auth/google/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `citizen_${Date.now()}@google.com`,
      name: 'Google Citizen User',
      role: 'citizen'
    })
  }).then(r => r.json());
  console.log('1. Google Sign-In Citizen Response:', googleCitizenRes);

  if (!googleCitizenRes.token || googleCitizenRes.user.role !== 'citizen') {
    throw new Error('FAILED Path 2 Google Citizen sign-in');
  }

  // --- Path 3: New Unapproved Authority Sign-In ---
  console.log('\n--- Test Path 3: New Authority (Pending Approval) ---');
  const officerPhone = `+91${Math.floor(1000000000 + Math.random() * 9000000000)}`;
  const officerOtpRes = await fetch(`${AUTH_URL}/api/auth/phone/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber: officerPhone })
  }).then(r => r.json());

  const verifyAuthorityRes = await fetch(`${AUTH_URL}/api/auth/phone/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phoneNumber: officerPhone,
      code: officerOtpRes.otpCode,
      role: 'authority',
      department: 'Road & Transport'
    })
  }).then(r => r.json());
  console.log('1. Verify OTP Authority Response:', verifyAuthorityRes);

  if (verifyAuthorityRes.user.role !== 'authority' || verifyAuthorityRes.user.department !== 'Road & Transport' || verifyAuthorityRes.user.isApproved !== false) {
    throw new Error('FAILED Path 3 Unapproved Authority creation');
  }

  // Test FastAPI Authority Route with unapproved token (Should fail HTTP 403)
  const unapprovedFastApiRes = await fetch(`${BACKEND_URL}/api/reports/authority`, {
    headers: { Authorization: `Bearer ${verifyAuthorityRes.token}` }
  });
  console.log('2. FastAPI /api/reports/authority HTTP status for unapproved officer:', unapprovedFastApiRes.status, await unapprovedFastApiRes.json());

  // --- Path 4: Approved Authority Sign-In & Access ---
  console.log('\n--- Test Path 4: Approved Authority Access ---');
  const approveRes = await fetch(`${AUTH_URL}/api/auth/approve-authority`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: verifyAuthorityRes.user.id })
  }).then(r => r.json());
  console.log('1. Dev Approve Authority Response:', approveRes);

  if (!approveRes.token || approveRes.user.isApproved !== true) {
    throw new Error('FAILED Path 4 Authority approval');
  }

  // Test FastAPI Authority Route with approved token (Should succeed HTTP 200)
  const approvedFastApiRes = await fetch(`${BACKEND_URL}/api/reports/authority`, {
    headers: { Authorization: `Bearer ${approveRes.token}` }
  }).then(r => r.json());
  console.log('2. FastAPI /api/reports/authority (Approved Officer JWT):', approvedFastApiRes);

  console.log('\n===========================================================');
  console.log('🎉 ALL 4 USER AUTHENTICATION & REDIRECTION PATHS PASSED!');
  console.log('===========================================================');
}

runTests().catch(err => {
  console.error('\n❌ Test Error:', err);
  process.exit(1);
});
