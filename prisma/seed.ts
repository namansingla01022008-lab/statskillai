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

  // 11. Seed Initial Applications
  console.log('[Seed] Seeding Initial Applications...');
  const aarav = await prisma.user.findFirst({ where: { role: 'learner' } });
  const opp1 = await prisma.opportunity.findFirst({ where: { id: 'opp-101' } });
  const opp2 = await prisma.opportunity.findFirst({ where: { id: 'opp-104' } });

  if (aarav && opp1) {
    await prisma.application.upsert({
      where: { id: 'app-init-1' },
      update: {
        status: 'Under review',
        matchPercentage: 82,
      },
      create: {
        id: 'app-init-1',
        opportunityId: opp1.id,
        opportunityTitle: opp1.title,
        organisation: opp1.organisation,
        userId: aarav.id,
        userName: aarav.name,
        userEmail: aarav.email,
        status: 'Under review',
        matchPercentage: 82,
        notes: 'Submitted resume and SWAYAM certification verification ID.',
      },
    });
  }

  if (aarav && opp2) {
    await prisma.application.upsert({
      where: { id: 'app-init-2' },
      update: {
        status: 'Submitted',
        matchPercentage: 78,
      },
      create: {
        id: 'app-init-2',
        opportunityId: opp2.id,
        opportunityTitle: opp2.title,
        organisation: opp2.organisation,
        userId: aarav.id,
        userName: aarav.name,
        userEmail: aarav.email,
        status: 'Submitted',
        matchPercentage: 78,
        notes: 'Enclosed provisional transcript and assessment scorecard.',
      },
    });
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
