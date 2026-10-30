const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const coursesPath = path.join(__dirname, '..', 'data', 'courses.seed.json');
const careersPath = path.join(__dirname, '..', 'data', 'careers.seed.json');

function probeUrl(url) {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(url);
      const client = parsed.protocol === 'https:' ? https : http;

      const req = client.request(url, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'StatSkillAI-VerificationBot/1.0 (+https://statskillai.gov.in/bot)',
          'Accept': '*/*'
        },
        timeout: 8000
      }, (res) => {
        // Accept 2xx, 3xx redirects, and 403 (some government firewalls block automated HEAD)
        const isHealthy = res.statusCode >= 200 && res.statusCode < 400;
        resolve({ url, statusCode: res.statusCode, ok: isHealthy || res.statusCode === 403 });
      });

      req.on('error', (err) => {
        resolve({ url, error: err.message, ok: false });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ url, error: 'Request Timeout (8s)', ok: false });
      });

      req.end();
    } catch (e) {
      resolve({ url, error: e.message, ok: false });
    }
  });
}

async function runLinkChecker() {
  console.log('🔗 [Weekly Link Integrity Checker] Checking all registered course and career source URLs...\n');

  let brokenCount = 0;
  let healthyCount = 0;

  const courses = fs.existsSync(coursesPath) ? JSON.parse(fs.readFileSync(coursesPath, 'utf8')) : [];
  const careers = fs.existsSync(careersPath) ? JSON.parse(fs.readFileSync(careersPath, 'utf8')) : [];

  const allItems = [
    ...courses.map(c => ({ type: 'Course', id: c.id, url: c.source_url, item: c })),
    ...careers.map(cr => ({ type: 'Career', id: cr.id, url: cr.source_url, item: cr }))
  ];

  for (const entry of allItems) {
    if (!entry.url) continue;

    console.log(`Checking [${entry.type}] ${entry.id} -> ${entry.url}`);
    const result = await probeUrl(entry.url);

    if (!result.ok) {
      console.warn(`  ⚠️ Broken or unresponsive link: ${result.statusCode || result.error}`);
      entry.item.status = 'broken';
      brokenCount++;
    } else {
      console.log(`  ✅ Healthy link (HTTP ${result.statusCode})`);
      healthyCount++;
    }

    // Rate-limiting: at least 2 seconds between sequential network requests
    await new Promise(r => setTimeout(r, 2000));
  }

  // Update seed files with any broken status changes
  fs.writeFileSync(coursesPath, JSON.stringify(courses, null, 2), 'utf8');
  fs.writeFileSync(careersPath, JSON.stringify(careers, null, 2), 'utf8');

  console.log('\n========================================');
  console.log(`LINK CHECK SUMMARY: ${healthyCount} Healthy, ${brokenCount} Broken`);
  console.log('Any broken records have their status set to "broken" to be hidden from learners.');
  console.log('========================================\n');
}

runLinkChecker().catch(err => {
  console.error('Link checker failed:', err);
  process.exit(1);
});
