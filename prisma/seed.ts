import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import {
  SEED_USERS,
  SEED_ORGANISATIONS,
  SEED_COURSES,
  SEED_OPPORTUNITIES,
  SEED_MENTORS,
  SEED_PROFILES,
  SEED_INITIAL_ATTEMPTS,
  SEED_INITIAL_GAPS,
  SEED_INITIAL_LEARNING_PATH,
  SEED_MENTORSHIPS,
  SEED_DIRECT_MESSAGES,
} from '../src/services/seedData';

const prisma = new PrismaClient();

export async function seedDatabase() {
  console.log('[Seed] Starting database seeding...');

  const defaultPasswordHash = await bcrypt.hash('DemoPassword123!', 10);

  // 1. Seed Organisations
  console.log('[Seed] Seeding Organisations...');
  for (const org of SEED_ORGANISATIONS) {
    await prisma.organisation.upsert({
      where: { name: org.name },
      update: {
        sector: org.sector,
        description: org.description,
      },
      create: {
        id: org.id,
        name: org.name,
        sector: org.sector,
        description: org.description,
      },
    });
  }

  // 2. Seed Users
  console.log('[Seed] Seeding Users...');
  for (const user of SEED_USERS) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        role: user.role,
        profileType: user.profileType,
        department: user.department,
        designation: user.designation,
      },
      create: {
        id: user.id,
        name: user.name,
        email: user.email,
        passwordHash: defaultPasswordHash,
        role: user.role,
        profileType: user.profileType,
        department: user.department,
        designation: user.designation,
      },
    });
  }

  // 3. Seed Learner Profiles
  console.log('[Seed] Seeding Learner Profiles...');
  for (const [userId, profile] of Object.entries(SEED_PROFILES)) {
    const userExists = await prisma.user.findUnique({ where: { id: userId } });
    if (!userExists) continue;

    await prisma.learnerProfile.upsert({
      where: { userId },
      update: {
        fullName: profile.fullName,
        profileType: profile.profileType,
        highestEducation: profile.highestEducation,
        qualifications: profile.qualifications,
        currentRoleOrCourse: profile.currentRoleOrCourse,
        yearsOfExperience: profile.yearsOfExperience,
        organisationOrInstitution: profile.organisationOrInstitution,
        skills: JSON.stringify(profile.skills || []),
        interests: JSON.stringify(profile.interests || []),
        previousTrainings: JSON.stringify(profile.previousTrainings || []),
        careerGoal: profile.careerGoal || '',
        targetDomainScores: JSON.stringify(profile.targetDomainScores || {}),
        completeness: profile.completeness || 80,
      },
      create: {
        userId,
        fullName: profile.fullName,
        profileType: profile.profileType,
        highestEducation: profile.highestEducation,
        qualifications: profile.qualifications,
        currentRoleOrCourse: profile.currentRoleOrCourse,
        yearsOfExperience: profile.yearsOfExperience,
        organisationOrInstitution: profile.organisationOrInstitution,
        skills: JSON.stringify(profile.skills || []),
        interests: JSON.stringify(profile.interests || []),
        previousTrainings: JSON.stringify(profile.previousTrainings || []),
        careerGoal: profile.careerGoal || '',
        targetDomainScores: JSON.stringify(profile.targetDomainScores || {}),
        completeness: profile.completeness || 80,
      },
    });
  }

  // 4. Seed Courses
  console.log('[Seed] Seeding Courses...');
  for (const course of SEED_COURSES) {
    await prisma.course.upsert({
      where: { id: course.id },
      update: {
        title: course.title,
        domain: course.domain,
        provider: course.provider,
        source: course.source,
        duration: course.duration,
        level: course.level,
        description: course.description,
        portalUrl: course.portalUrl,
        skillsCovered: JSON.stringify(course.skillsCovered || []),
      },
      create: {
        id: course.id,
        title: course.title,
        domain: course.domain,
        provider: course.provider,
        source: course.source,
        duration: course.duration,
        level: course.level,
        description: course.description,
        portalUrl: course.portalUrl,
        skillsCovered: JSON.stringify(course.skillsCovered || []),
      },
    });
  }

  // 5. Seed Opportunities
  console.log('[Seed] Seeding Opportunities...');
  for (const opp of SEED_OPPORTUNITIES) {
    await prisma.opportunity.upsert({
      where: { id: opp.id },
      update: {
        title: opp.title,
        organisation: opp.organisation,
        orgId: opp.orgId,
        sector: opp.sector,
        location: opp.location,
        type: opp.type,
        requiredSkills: JSON.stringify(opp.requiredSkills || []),
        minDomainLevels: JSON.stringify(opp.minDomainLevels || {}),
        description: opp.description,
        deadline: opp.deadline,
        stipendOrSalary: opp.stipendOrSalary,
      },
      create: {
        id: opp.id,
        title: opp.title,
        organisation: opp.organisation,
        orgId: opp.orgId,
        sector: opp.sector,
        location: opp.location,
        type: opp.type,
        requiredSkills: JSON.stringify(opp.requiredSkills || []),
        minDomainLevels: JSON.stringify(opp.minDomainLevels || {}),
        description: opp.description,
        deadline: opp.deadline,
        stipendOrSalary: opp.stipendOrSalary,
      },
    });
  }

  // 6. Seed Mentors
  console.log('[Seed] Seeding Mentors...');
  for (const mentor of SEED_MENTORS) {
    const userExists = await prisma.user.findUnique({ where: { id: mentor.userId } });
    if (!userExists) continue;

    await prisma.mentor.upsert({
      where: { userId: mentor.userId },
      update: {
        name: mentor.name,
        title: mentor.title,
        organisation: mentor.organisation,
        field: mentor.field,
        experienceYears: mentor.experienceYears,
        languages: JSON.stringify(mentor.languages || []),
        bio: mentor.bio,
        isVerified: mentor.isVerified,
        verifiedDate: mentor.verifiedDate,
        availability: mentor.availability,
        rating: mentor.rating,
        totalReviews: mentor.totalReviews,
      },
      create: {
        id: mentor.id,
        userId: mentor.userId,
        name: mentor.name,
        title: mentor.title,
        organisation: mentor.organisation,
        field: mentor.field,
        experienceYears: mentor.experienceYears,
        languages: JSON.stringify(mentor.languages || []),
        bio: mentor.bio,
        isVerified: mentor.isVerified,
        verifiedDate: mentor.verifiedDate,
        availability: mentor.availability,
        rating: mentor.rating,
        totalReviews: mentor.totalReviews,
      },
    });
  }

  // 7. Seed Initial Assessment Attempts
  console.log('[Seed] Seeding Assessment Attempts...');
  for (const [userId, attempts] of Object.entries(SEED_INITIAL_ATTEMPTS)) {
    const userExists = await prisma.user.findUnique({ where: { id: userId } });
    if (!userExists) continue;

    for (const attempt of attempts) {
      await prisma.assessmentAttempt.upsert({
        where: { id: attempt.id },
        update: {
          questions: JSON.stringify(attempt.questions || []),
          userAnswers: JSON.stringify(attempt.userAnswers || []),
          score: attempt.score,
          completed: attempt.completed,
        },
        create: {
          id: attempt.id,
          userId,
          domain: attempt.domain,
          date: new Date(attempt.date),
          score: attempt.score,
          earnedWeight: attempt.earnedWeight,
          maxWeight: attempt.maxWeight,
          questions: JSON.stringify(attempt.questions || []),
          userAnswers: JSON.stringify(attempt.userAnswers || []),
          completed: attempt.completed,
        },
      });
    }
  }

  // 8. Seed Initial Gap Analyses
  console.log('[Seed] Seeding Gap Analyses...');
  for (const [userId, gap] of Object.entries(SEED_INITIAL_GAPS)) {
    const userExists = await prisma.user.findUnique({ where: { id: userId } });
    if (!userExists) continue;

    await prisma.gapAnalysis.upsert({
      where: { userId },
      update: {
        timestamp: new Date(gap.timestamp),
        strengths: JSON.stringify(gap.strengths || []),
        gaps: JSON.stringify(gap.gaps || []),
        summary: gap.summary,
        priorityOrder: JSON.stringify(gap.priorityOrder || []),
        domainScores: JSON.stringify(gap.domainScores || {}),
        targetScores: JSON.stringify(gap.targetScores || {}),
        overallScore: gap.overallScore || 0,
      },
      create: {
        id: gap.id,
        userId,
        timestamp: new Date(gap.timestamp),
        strengths: JSON.stringify(gap.strengths || []),
        gaps: JSON.stringify(gap.gaps || []),
        summary: gap.summary,
        priorityOrder: JSON.stringify(gap.priorityOrder || []),
        domainScores: JSON.stringify(gap.domainScores || {}),
        targetScores: JSON.stringify(gap.targetScores || {}),
        overallScore: gap.overallScore || 0,
      },
    });
  }

  // 9. Seed Initial Learning Paths
  console.log('[Seed] Seeding Learning Paths...');
  for (const [userId, path] of Object.entries(SEED_INITIAL_LEARNING_PATH)) {
    const userExists = await prisma.user.findUnique({ where: { id: userId } });
    if (!userExists) continue;

    const savedPath = await prisma.learningPath.upsert({
      where: { userId },
      update: {
        title: path.title,
        careerGoal: path.careerGoal,
        progressPercent: path.progressPercent,
        isCompleted: path.isCompleted,
      },
      create: {
        id: path.id,
        userId,
        title: path.title,
        careerGoal: path.careerGoal,
        progressPercent: path.progressPercent,
        isCompleted: path.isCompleted,
      },
    });

    // Delete existing steps and reinsert for seed consistency
    await prisma.learningStep.deleteMany({ where: { learningPathId: savedPath.id } });
    for (let i = 0; i < (path.steps || []).length; i++) {
      const step = path.steps[i];
      await prisma.learningStep.create({
        data: {
          id: `${savedPath.id}-${step.id}`,
          learningPathId: savedPath.id,
          title: step.title,
          domain: step.domain,
          type: step.type,
          estimatedDuration: step.estimatedDuration,
          source: step.source,
          rationale: step.rationale,
          status: step.status,
          isAiSuggested: Boolean(step.isAiSuggested),
          isMentorRecommended: Boolean(step.isMentorRecommended),
          courseId: step.courseId,
          orderIndex: i,
        },
      });
    }
  }

  // 10. Seed Mentorships & Direct Messages
  console.log('[Seed] Seeding Mentorships & Messages...');
  for (const m of SEED_MENTORSHIPS) {
    const mentor = await prisma.mentor.findFirst({ where: { userId: m.mentorUserId } });
    if (!mentor) continue;

    const savedMentorship = await prisma.mentorship.upsert({
      where: { id: m.id },
      update: {
        status: m.status,
        meetingSchedule: m.meetingSchedule,
        feedbackNotes: JSON.stringify(m.feedbackNotes || []),
        rating: m.rating,
        ratingComment: m.ratingComment,
      },
      create: {
        id: m.id,
        mentorId: mentor.id,
        mentorName: m.mentorName,
        mentorUserId: m.mentorUserId,
        learnerId: m.learnerId,
        learnerName: m.learnerName,
        learnerProfileType: m.learnerProfileType,
        goalMessage: m.goalMessage,
        status: m.status,
        requestedAt: new Date(m.requestedAt),
        meetingSchedule: m.meetingSchedule,
        feedbackNotes: JSON.stringify(m.feedbackNotes || []),
        rating: m.rating,
        ratingComment: m.ratingComment,
      },
    });

    // Add seed messages for this mentorship
    const msgs = SEED_DIRECT_MESSAGES.filter((dm) => dm.mentorshipId === m.id);
    for (const msg of msgs) {
      const senderExists = await prisma.user.findUnique({ where: { id: msg.senderId } });
      if (!senderExists) continue;

      const existingMsg = await prisma.directMessage.findUnique({ where: { id: msg.id } });
      if (!existingMsg) {
        await prisma.directMessage.create({
          data: {
            id: msg.id,
            mentorshipId: savedMentorship.id,
            senderId: msg.senderId,
            senderName: msg.senderName,
            senderRole: msg.senderRole,
            text: msg.text,
            timestamp: new Date(msg.timestamp),
          },
        });
      }
    }
  }

  // 11. Seed Reward Rules
  console.log('[Seed] Seeding Reward Rules...');
  const DEFAULT_RULES = [
    { eventType: 'ASSESSMENT_PASS', label: 'Domain Assessment Passed', xpAmount: 10, description: 'Pass an objective psychometric competency assessment (≥60%)' },
    { eventType: 'QUIZ_PASS', label: 'AI Document Quiz Passed', xpAmount: 10, description: 'Pass an AI-generated document evaluation quiz (≥60%)' },
    { eventType: 'STEP_COMPLETE', label: 'Learning Step Completed', xpAmount: 10, description: 'Complete a verified competency milestone in your learning pathway' },
    { eventType: 'COURSE_COMPLETE', label: 'Full Course Completed', xpAmount: 100, description: 'Graduate from an accredited national training course' },
    { eventType: 'PATH_COMPLETE', label: 'Learning Pathway Completed', xpAmount: 150, description: 'Complete all sequenced steps in a personalized learning pathway' },
    { eventType: 'CERT_APPROVED', label: 'Verified Certificate', xpAmount: 200, description: 'Submit an official course certificate verified by an administrator' },
    { eventType: 'STREAK_7DAY', label: '7-Day Learning Streak', xpAmount: 50, description: 'Maintain consistent learning activity across 7 active days' },
  ];

  for (const rule of DEFAULT_RULES) {
    await prisma.rewardRule.upsert({
      where: { eventType: rule.eventType },
      update: {
        label: rule.label,
        xpAmount: rule.xpAmount,
        description: rule.description,
        isActive: true,
      },
      create: {
        eventType: rule.eventType,
        label: rule.label,
        xpAmount: rule.xpAmount,
        description: rule.description,
        isActive: true,
      },
    });
  }

  // 12. Seed Demo Rewards Catalogue
  console.log('[Seed] Seeding Reward Catalogue...');
  const DEMO_REWARDS = [
    {
      id: 'reward-amazon-50',
      name: 'Amazon ₹50 E-Gift Card',
      brand: 'Amazon',
      category: 'VOUCHER',
      description: 'Instant digital gift voucher redeemable on Amazon.in across all eligible items and book categories.',
      xpCost: 500,
      stock: 50,
      isActive: true,
      imageUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=500&auto=format&fit=crop&q=60',
    },
    {
      id: 'reward-swiggy-100',
      name: 'Swiggy ₹100 Food Voucher',
      brand: 'Swiggy',
      category: 'VOUCHER',
      description: 'Digital food ordering voucher valid across all top-rated restaurants on Swiggy Gourmet and Instamart.',
      xpCost: 900,
      stock: 40,
      isActive: true,
      imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500&auto=format&fit=crop&q=60',
    },
    {
      id: 'reward-zomato-100',
      name: 'Zomato ₹100 Dining Voucher',
      brand: 'Zomato',
      category: 'VOUCHER',
      description: 'Instant electronic gift voucher for culinary delights, dining out and quick deliveries on Zomato.',
      xpCost: 900,
      stock: 40,
      isActive: true,
      imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&auto=format&fit=crop&q=60',
    },
    {
      id: 'reward-python-pack',
      name: 'Advanced Python for Data Analytics Pass',
      brand: 'StatSkill Partner',
      category: 'COURSE_ACCESS',
      description: 'Exclusive 3-month access to comprehensive hands-on statistical programming labs and interactive datasets.',
      xpCost: 1200,
      stock: -1,
      isActive: true,
      imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500&auto=format&fit=crop&q=60',
    },
    {
      id: 'reward-karmayogi-sub',
      name: 'National Learning Resources Annual Pass',
      brand: 'iGOT Partner',
      category: 'SUBSCRIPTION',
      description: 'Annual premium pass providing verified course completion badges and downloadable research journals.',
      xpCost: 1500,
      stock: 25,
      isActive: true,
      imageUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=500&auto=format&fit=crop&q=60',
    },
  ];

  for (const reward of DEMO_REWARDS) {
    await prisma.reward.upsert({
      where: { id: reward.id },
      update: {
        name: reward.name,
        brand: reward.brand,
        category: reward.category,
        description: reward.description,
        xpCost: reward.xpCost,
        stock: reward.stock,
        isActive: reward.isActive,
        imageUrl: reward.imageUrl,
      },
      create: reward,
    });
  }

  // 13. Seed Badges
  console.log('[Seed] Seeding Badges...');
  const SEED_BADGES = [
    { key: 'FIRST_STEP', name: 'First Milestone', description: 'Completed your first learning module step.', iconName: 'Footprints', tier: 'BRONZE', xpBonus: 15 },
    { key: 'FIRST_COURSE', name: 'Course Graduate', description: 'Successfully completed a full certified training course.', iconName: 'GraduationCap', tier: 'SILVER', xpBonus: 50 },
    { key: 'QUIZ_MASTER', name: 'Quiz Master', description: 'Passed 3 or more competency evaluations or AI quizzes.', iconName: 'BrainCircuit', tier: 'SILVER', xpBonus: 30 },
    { key: 'CERT_CHAMPION', name: 'Certificate Champion', description: 'Submitted and verified an official certificate.', iconName: 'Award', tier: 'GOLD', xpBonus: 75 },
    { key: 'PATH_EXPLORER', name: 'Pathway Conqueror', description: 'Completed an entire personalized skill progression pathway.', iconName: 'Compass', tier: 'GOLD', xpBonus: 100 },
    { key: 'CONSISTENT_LEARNER', name: '7-Day Streak', description: 'Maintained 7 consecutive or milestone learning days.', iconName: 'Flame', tier: 'SILVER', xpBonus: 50 },
    { key: 'SKILL_CHAMPION', name: 'XP Titan', description: 'Accumulated over 500 total XP in the StatSkillAI reward ledger.', iconName: 'Trophy', tier: 'PLATINUM', xpBonus: 150 },
  ];

  for (const badge of SEED_BADGES) {
    await prisma.badge.upsert({
      where: { key: badge.key },
      update: badge,
      create: badge,
    });
  }

  // 14. Seed Initial Balances & Streaks for Learners
  console.log('[Seed] Seeding Learner Balances & Streaks...');
  const DEMO_BALANCES: Record<string, { totalEarned: number; balance: number; totalRedeemed: number; streak: number }> = {
    'user-student': { totalEarned: 620, balance: 520, totalRedeemed: 100, streak: 5 },
    'user-gov': { totalEarned: 480, balance: 480, totalRedeemed: 0, streak: 3 },
    'user-private': { totalEarned: 350, balance: 350, totalRedeemed: 0, streak: 2 },
  };

  const todayStr = new Date().toISOString().slice(0, 10);

  for (const [userId, stats] of Object.entries(DEMO_BALANCES)) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) continue;

    await prisma.rewardBalance.upsert({
      where: { userId },
      update: {
        totalEarned: stats.totalEarned,
        balance: stats.balance,
        totalRedeemed: stats.totalRedeemed,
      },
      create: {
        userId,
        totalEarned: stats.totalEarned,
        balance: stats.balance,
        totalRedeemed: stats.totalRedeemed,
      },
    });

    await prisma.learnerStreak.upsert({
      where: { userId },
      update: {
        currentStreak: stats.streak,
        longestStreak: Math.max(stats.streak, 7),
        totalActiveDays: stats.streak + 4,
        lastActivityDate: todayStr,
      },
      create: {
        userId,
        currentStreak: stats.streak,
        longestStreak: Math.max(stats.streak, 7),
        totalActiveDays: stats.streak + 4,
        lastActivityDate: todayStr,
      },
    });

    // Award default badges
    await prisma.userBadge.upsert({
      where: { userId_badgeKey: { userId, badgeKey: 'FIRST_STEP' } },
      update: {},
      create: { userId, badgeKey: 'FIRST_STEP' },
    });
    if (stats.totalEarned >= 500) {
      await prisma.userBadge.upsert({
        where: { userId_badgeKey: { userId, badgeKey: 'SKILL_CHAMPION' } },
        update: {},
        create: { userId, badgeKey: 'SKILL_CHAMPION' },
      });
    }
  }

  console.log('[Seed] Database successfully seeded with factory data!');
}

if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  seedDatabase()
    .then(async () => {
      await prisma.$disconnect();
    })
    .catch(async (e) => {
      console.error('[Seed Error]:', e);
      await prisma.$disconnect();
      process.exit(1);
    });
}
