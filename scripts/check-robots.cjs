const https = require('https');
const http = require('http');

const sites = [
  'https://nptel.ac.in/robots.txt',
  'https://swayam.gov.in/robots.txt',
  'https://igotkarmayogi.gov.in/robots.txt',
  'https://mospi.gov.in/robots.txt',
  'https://upsc.gov.in/robots.txt',
  'https://ssc.gov.in/robots.txt',
  'https://www.ncs.gov.in/robots.txt',
  'https://data.gov.in/robots.txt'
];

async function checkUrl(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, {
      headers: {
        'User-Agent': 'StatSkillAI-VerificationBot/1.0 (+https://statskillai.gov.in/bot)'
      },
      timeout: 5000
    }, (res) => {
      let data = '';
      res.on('data', chunk => { if (data.length < 500) data += chunk; });
      res.on('end', () => {
        resolve({ url, statusCode: res.statusCode, snippet: data.slice(0, 150).replace(/\s+/g, ' ') });
      });
    });

    req.on('error', (err) => {
      resolve({ url, error: err.message });
    });
    req.on('timeout', () => {
      req.destroy();
      resolve({ url, error: 'Timeout' });
    });
  });
}

async function run() {
  for (const s of sites) {
    const res = await checkUrl(s);
    console.log(JSON.stringify(res));
    await new Promise(r => setTimeout(r, 2000));
  }
}

run();
