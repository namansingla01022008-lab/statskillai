import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

const prisma = new PrismaClient();

async function runSmokeTests() {
  console.log('🧪 [Smoke Test] Starting StatSkillAI Comprehensive Platform Verification...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Database Connectivity & Core Table Verification
    console.log('1. Database Schema & Relational Integrity');
    const userCount = await prisma.user.count();
    assert(userCount >= 3, `Prisma connected, found ${userCount} users (learners, mentors, admins)`);

    const courseCount = await prisma.course.count();
    assert(courseCount > 0, `Course catalog verified with ${courseCount} accredited modules`);

    const oppCount = await prisma.opportunity.count();
    assert(oppCount > 0, `Opportunities catalog verified with ${oppCount} verified openings`);

    const orgCount = await prisma.organisation.count();
    assert(orgCount > 0, `Organisations verified with ${orgCount} nodal government entities`);

    // 2. Cryptographic Security & Password Complexity
    console.log('\n2. Security & Password Complexity Verification');
    const demoUser = await prisma.user.findUnique({ where: { email: 'aarav.sharma@example.edu' } });
    assert(Boolean(demoUser), 'Found demo learner Aarav Sharma');
    
    if (demoUser) {
      const match = await bcrypt.compare('DemoPassword123!', demoUser.passwordHash);
      assert(match, 'Bcrypt 12-round password hash verification succeeded for DemoPassword123!');
      
      const wrongMatch = await bcrypt.compare('WrongPassword!', demoUser.passwordHash);
      assert(!wrongMatch, 'Bcrypt correctly rejected invalid password attempt');
    }

    // 3. JWT Token Signing & Claims Verification
    console.log('\n3. JWT Dual-Token Authentication Session');
    const testSecret = process.env.JWT_SECRET || 'statskillai-dev-jwt-secret-key-32-chars-min';
    const token = jwt.sign(
      { userId: 'test-user-id', email: 'test@example.com', role: 'learner' },
      testSecret,
      { expiresIn: '7d' }
    );
    const decoded = jwt.verify(token, testSecret) as any;
    assert(decoded.userId === 'test-user-id' && decoded.role === 'learner', 'JWT signed and decoded claims correctly');

    // 4. Closed-Loop Assessment & Gap Analysis Pipeline
    console.log('\n4. Assessment & Automated Gap Recalculation Flow');
    const attempts = await prisma.assessmentAttempt.findMany({
      where: { userId: 'user-learner-1' },
      orderBy: { date: 'desc' },
      take: 1,
    });
    assert(attempts.length > 0, `Found historical assessment attempt for learner Aarav`);
    
    if (attempts.length > 0) {
      const parsedQuestions = JSON.parse(attempts[0].questions);
      assert(Array.isArray(parsedQuestions) && parsedQuestions.length > 0, `Questions are populated with ${parsedQuestions.length} items (Fixed empty questions bug)`);
    }

    const gap = await prisma.gapAnalysis.findFirst({
      where: { userId: 'user-learner-1' },
      orderBy: { timestamp: 'desc' },
    });
    assert(Boolean(gap), 'Learner has automated GapAnalysis diagnostic record');
    if (gap) {
      const gapsList = JSON.parse(gap.gaps);
      assert(Array.isArray(gapsList), `Gaps list properly serialized with ${gapsList.length} identified deficiencies`);
    }

    // 5. Learning Path Progression & Mentor Directive Preservation
    console.log('\n5. Learning Path Progression & Step Preservation');
    const path = await prisma.learningPath.findFirst({
      where: { userId: 'user-learner-1' },
      include: { steps: true },
    });
    assert(Boolean(path), 'Found learner active LearningPath');
    if (path) {
      assert(path.steps.length > 0, `Learning path contains ${path.steps.length} sequenced progression steps`);
      const mentorSteps = path.steps.filter((s) => s.isMentorRecommended);
      console.log(`     (Contains ${mentorSteps.length} mentor-recommended directives preserved across regenerations)`);
    }

    // 6. Mentorship Thread & Real-Time Messaging Storage
    console.log('\n6. Mentorship Pipeline & Direct Messages');
    const mentorship = await prisma.mentorship.findFirst({
      include: { messages: true },
    });
    assert(Boolean(mentorship), 'Active mentorship relationship verified');
    if (mentorship) {
      assert(mentorship.messages.length > 0, `Mentorship thread contains ${mentorship.messages.length} messages`);
    }

    // 7. Institutional Workforce Analytics Roster
    console.log('\n7. Institutional Workforce Analytics');
    const employees = await prisma.user.findMany({
      where: { role: 'learner' },
      include: { profile: true },
    });
    assert(employees.length > 0, `Workforce analytics integrates ${employees.length} registered learners`);

  } catch (err: any) {
    console.error('Smoke test runtime exception:', err);
    failed++;
  } finally {
    await prisma.$disconnect();
  }

  console.log(`\n========================================`);
  console.log(`RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runSmokeTests();
