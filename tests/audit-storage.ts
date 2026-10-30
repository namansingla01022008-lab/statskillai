import * as seed from '../src/services/seedData';

const collections: Record<string, any> = {
  users: seed.SEED_USERS,
  courses: seed.SEED_COURSES,
  opportunities: seed.SEED_OPPORTUNITIES,
  organisations: seed.SEED_ORGANISATIONS,
  mentors: seed.SEED_MENTORS,
  profiles: seed.SEED_PROFILES,
  assessmentAttempts: seed.SEED_INITIAL_ATTEMPTS,
  gapAnalyses: seed.SEED_INITIAL_GAPS,
  learningPaths: seed.SEED_INITIAL_LEARNING_PATH,
  mentorships: seed.SEED_MENTORSHIPS,
  messages: seed.SEED_DIRECT_MESSAGES,
  orgEmployees: seed.generateSeedOrgEmployees(),
};

console.log('=== SEED DATA SIZES IN LOCALSTORAGE ===');
let total = 0;
for (const [k, v] of Object.entries(collections)) {
  const json = JSON.stringify(v);
  const bytes = Buffer.byteLength(json, 'utf8');
  total += bytes;
  console.log(`${k.padEnd(20)}: ${(bytes / 1024).toFixed(2).padStart(7)} KB (${bytes.toString().padStart(6)} bytes)`);
}
console.log('-------------------------------------------');
console.log(`${'TOTAL INITIAL SEED'.padEnd(20)}: ${(total / 1024).toFixed(2).padStart(7)} KB (${total.toString().padStart(6)} bytes)`);

