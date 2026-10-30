const fs = require('fs');
const path = require('path');
const https = require('https');

const ALLOWED_DOMAINS = [
  'nptel.ac.in',
  'onlinecourses.nptel.ac.in',
  'swayam.gov.in',
  'igotkarmayogi.gov.in',
  'mospi.gov.in',
  'upsc.gov.in',
  'ssc.gov.in',
  'ncs.gov.in',
  'www.ncs.gov.in',
  'data.gov.in',
  'esankhyiki.mospi.gov.in',
  'microdata.gov.in'
];

function isAllowlistedDomain(urlString) {
  try {
    const parsed = new URL(urlString);
    if (parsed.protocol !== 'https:') return false;
    const hostname = parsed.hostname.toLowerCase();
    return ALLOWED_DOMAINS.some(allowed => hostname === allowed || hostname.endsWith('.' + allowed));
  } catch {
    return false;
  }
}

function isValidIsoDate(dateString) {
  if (!dateString) return false;
  const d = new Date(dateString);
  return !isNaN(d.getTime());
}

async function validateSeeds() {
  console.log('🔍 [Seed Validator] Running validation across /data seed catalogs...\n');

  let errors = 0;
  let warnings = 0;

  // 1. Validate Courses
  console.log('1. Validating courses.seed.json...');
  const coursesPath = path.join(__dirname, '..', 'data', 'courses.seed.json');
  if (!fs.existsSync(coursesPath)) {
    console.error('❌ courses.seed.json does not exist!');
    process.exit(1);
  }

  const courses = JSON.parse(fs.readFileSync(coursesPath, 'utf8'));
  const courseUrls = new Set();
  const courseIds = new Set();

  for (let i = 0; i < courses.length; i++) {
    const c = courses[i];
    const prefix = `[Course #${i + 1} - ${c.id || 'NO_ID'}]`;

    // ID
    if (!c.id) { console.error(`❌ ${prefix} missing required field: id`); errors++; }
    if (courseIds.has(c.id)) { console.error(`❌ ${prefix} duplicate id: ${c.id}`); errors++; }
    courseIds.add(c.id);

    // Title
    if (!c.title || typeof c.title !== 'string') { console.error(`❌ ${prefix} missing or invalid title`); errors++; }

    // Provider
    const validProviders = ['iGOT Karmayogi', 'NPTEL', 'SWAYAM', 'NSSTA', 'MoSPI', 'other'];
    if (!validProviders.includes(c.provider)) {
      console.error(`❌ ${prefix} provider "${c.provider}" not in allowed list: ${validProviders.join(', ')}`);
      errors++;
    }

    // Status
    const validStatuses = ['verified', 'unverified', 'broken', 'hidden'];
    if (!validStatuses.includes(c.status)) {
      console.error(`❌ ${prefix} invalid status "${c.status}"`);
      errors++;
    }

    // Source URL
    if (!c.source_url) {
      console.error(`❌ ${prefix} missing required source_url`);
      errors++;
    } else {
      if (!isAllowlistedDomain(c.source_url)) {
        console.error(`❌ ${prefix} source_url "${c.source_url}" is not https or not in allowlisted domains!`);
        errors++;
      }
      if (courseUrls.has(c.source_url)) {
        console.error(`❌ ${prefix} duplicate source_url: ${c.source_url}`);
        errors++;
      }
      courseUrls.add(c.source_url);
    }

    // Verified requirements: verified records require source_url and last_verified_at
    if (c.status === 'verified') {
      if (!c.last_verified_at || !isValidIsoDate(c.last_verified_at)) {
        console.error(`❌ ${prefix} verified course requires valid ISO last_verified_at!`);
        errors++;
      }
    }

    // Max 2 sentences in description
    if (c.description) {
      const sentences = c.description.split(/(?<=[.?!])\s+/).filter(Boolean);
      if (sentences.length > 3) {
        console.warn(`⚠️ ${prefix} description has ${sentences.length} sentences (target: max 2 sentences)`);
        warnings++;
      }
    }
  }
  console.log(`  -> Checked ${courses.length} courses (${courses.filter(c => c.status === 'verified').length} verified, ${courses.filter(c => c.status === 'unverified').length} unverified templates)\n`);

  // 2. Validate Careers
  console.log('2. Validating careers.seed.json...');
  const careersPath = path.join(__dirname, '..', 'data', 'careers.seed.json');
  const careers = JSON.parse(fs.readFileSync(careersPath, 'utf8'));
  const careerUrls = new Set();
  const careerIds = new Set();

  for (let i = 0; i < careers.length; i++) {
    const cr = careers[i];
    const prefix = `[Career #${i + 1} - ${cr.id || 'NO_ID'}]`;

    if (!cr.id) { console.error(`❌ ${prefix} missing id`); errors++; }
    if (careerIds.has(cr.id)) { console.error(`❌ ${prefix} duplicate id: ${cr.id}`); errors++; }
    careerIds.add(cr.id);

    if (!cr.role_title) { console.error(`❌ ${prefix} missing role_title`); errors++; }
    if (!cr.pathway) { console.error(`❌ ${prefix} missing pathway`); errors++; }
    if (!Array.isArray(cr.required_skills) || cr.required_skills.length === 0) { console.error(`❌ ${prefix} missing required_skills array`); errors++; }
    if (!cr.required_qualification) { console.error(`❌ ${prefix} missing required_qualification`); errors++; }
    if (!cr.entry_route) { console.error(`❌ ${prefix} missing entry_route`); errors++; }
    if (!cr.source_url || !isAllowlistedDomain(cr.source_url)) {
      console.error(`❌ ${prefix} invalid or non-allowlisted source_url: ${cr.source_url}`);
      errors++;
    }
    if (careerUrls.has(cr.source_url)) {
      console.error(`❌ ${prefix} duplicate source_url: ${cr.source_url}`);
      errors++;
    }
    careerUrls.add(cr.source_url);

    if (cr.status === 'verified') {
      if (!cr.last_verified_at || !isValidIsoDate(cr.last_verified_at)) {
        console.error(`❌ ${prefix} verified career requires valid ISO last_verified_at!`);
        errors++;
      }
    }
  }
  console.log(`  -> Checked ${careers.length} careers (${careers.filter(c => c.status === 'verified').length} verified, ${careers.filter(c => c.status === 'unverified').length} unverified templates)\n`);

  // 3. Validate Datasets
  console.log('3. Validating datasets.seed.json...');
  const datasetsPath = path.join(__dirname, '..', 'data', 'datasets.seed.json');
  const datasets = JSON.parse(fs.readFileSync(datasetsPath, 'utf8'));
  const datasetUrls = new Set();

  for (let i = 0; i < datasets.length; i++) {
    const ds = datasets[i];
    const prefix = `[Dataset #${i + 1} - ${ds.id || 'NO_ID'}]`;

    if (!ds.name) { console.error(`❌ ${prefix} missing name`); errors++; }
    if (!ds.publisher) { console.error(`❌ ${prefix} missing publisher`); errors++; }
    if (!ds.source_url || !isAllowlistedDomain(ds.source_url)) {
      console.error(`❌ ${prefix} invalid or non-allowlisted source_url: ${ds.source_url}`);
      errors++;
    }
    if (datasetUrls.has(ds.source_url)) {
      console.error(`❌ ${prefix} duplicate source_url: ${ds.source_url}`);
      errors++;
    }
    datasetUrls.add(ds.source_url);

    if (!ds.licence) { console.error(`❌ ${prefix} missing licence`); errors++; }
    if (!ds.attribution_text) { console.error(`❌ ${prefix} missing attribution_text`); errors++; }
  }
  console.log(`  -> Checked ${datasets.length} datasets\n`);

  console.log('========================================');
  console.log(`VALIDATION RESULT: ${errors} Errors, ${warnings} Warnings`);
  console.log('========================================\n');

  if (errors > 0) {
    console.error('Validation failed. Please fix the errors above before seeding.');
    process.exit(1);
  } else {
    console.log('✅ All seed files passed validation successfully!');
  }
}

validateSeeds().catch(err => {
  console.error('Validation runtime error:', err);
  process.exit(1);
});
