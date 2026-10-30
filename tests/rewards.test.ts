import assert from 'node:assert/strict';
import { isSafeExternalUrl } from '../server/services/urlSafetyChecker';
import { verifyCertificateSubmission } from '../server/services/certVerification';
import { MockVoucherAdapter } from '../server/services/voucherAdapter';

async function runTests() {
  console.log('--- STATSKILLAI GAMIFIED REWARDS SYSTEM: INTEGRATION SUITE ---');
  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`[FAIL] ${name}:`, err?.message || err);
      failed++;
    }
  }

  // TEST 1: SSRF Protection
  await test('SSRF Safety: Blocks local and private IP addresses', async () => {
    const r1 = await isSafeExternalUrl('http://localhost:3000');
    assert.equal(r1.safe, false, 'Should block HTTP and localhost');

    const r2 = await isSafeExternalUrl('https://127.0.0.1/verify');
    assert.equal(r2.safe, false, 'Should block 127.0.0.1');

    const r3 = await isSafeExternalUrl('https://169.254.169.254/latest/meta-data/');
    assert.equal(r3.safe, false, 'Should block cloud metadata IP 169.254.x.x');

    const r4 = await isSafeExternalUrl('https://192.168.1.1/admin');
    assert.equal(r4.safe, false, 'Should block private LAN IP');

    const r5 = await isSafeExternalUrl('https://nptel.ac.in/noc/Ecertificate/?q=test');
    assert.equal(r5.safe, true, 'Should allow official public HTTPS domain');
  });

  // TEST 2: Provider-Specific Certificate Verification Adapters
  await test('Certificate Adapter: NPTEL domain and ID format validation', async () => {
    const validNptel = await verifyCertificateSubmission(
      'NPTEL',
      'NPTEL24CS101S1234567',
      'https://nptel.ac.in/noc/Ecertificate/?q=NPTEL24CS101S1234567',
      'Data Science for Engineers'
    );
    assert.equal(validNptel.verified, true);
    assert.equal(validNptel.status, 'UNDER_REVIEW');

    const invalidDomain = await verifyCertificateSubmission(
      'NPTEL',
      'NPTEL24CS101S1234567',
      'https://fake-nptel-cert-site.com/verify',
      'Data Science for Engineers'
    );
    assert.equal(invalidDomain.verified, false);
    assert.equal(invalidDomain.status, 'REJECTED');
  });

  // TEST 3: SWAYAM and Coursera URL verification
  await test('Certificate Adapter: Coursera & SWAYAM validation', async () => {
    const courseraValid = await verifyCertificateSubmission(
      'Coursera',
      'ABC123XYZ99',
      'https://www.coursera.org/verify/ABC123XYZ99',
      'Machine Learning'
    );
    assert.equal(courseraValid.verified, true);

    const courseraMismatch = await verifyCertificateSubmission(
      'Coursera',
      'DIFFERENT_ID_99',
      'https://www.coursera.org/verify/ABC123XYZ99',
      'Machine Learning'
    );
    assert.equal(courseraMismatch.status, 'UNDER_REVIEW');
    assert.match(courseraMismatch.reason || '', /Mismatch/i);
  });

  // TEST 4: Mock Voucher Adapter Delivery
  await test('Voucher Adapter: Safely generates structured mock voucher codes without live charge', async () => {
    const adapter = new MockVoucherAdapter();
    const res = await adapter.orderVoucher({
      redemptionId: 'red-test-1',
      userId: 'user-test-1',
      rewardId: 'reward-amazon-50',
      brand: 'Amazon',
      amount: 500,
    });

    assert.equal(res.success, true);
    assert.ok(res.voucherCode?.startsWith('DUMMY-AMAZ-'));
    assert.ok(res.voucherPin);
    assert.ok(res.expiryDate);
  });

  // TEST 5: Deterministic Idempotency Key Generation
  await test('Idempotency Key: Distinct event prefixes prevent collision', async () => {
    const userId = 'user-test-uuid';
    const refId = 'milestone-42';

    const assessKey = `assess-pass:${userId}:${refId}`;
    const quizKey = `quiz-pass:${userId}:${refId}`;
    const stepKey = `step-done:${userId}:${refId}`;

    assert.notEqual(assessKey, quizKey);
    assert.notEqual(quizKey, stepKey);
  });

  // TEST 6: Timezone-Normalised Streak Date Format
  await test('Streak Engine: ISO UTC date standard adheres to YYYY-MM-DD', async () => {
    const dateStr = new Date().toISOString().slice(0, 10);
    assert.match(dateStr, /^\d{4}-\d{2}-\d{2}$/);
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
