import { prisma } from '../db';

export interface BadgeDefinition {
  key: string;
  name: string;
  description: string;
  iconName: string;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  xpBonus: number;
}

export const INITIAL_BADGES: BadgeDefinition[] = [
  {
    key: 'FIRST_STEP',
    name: 'First Milestone',
    description: 'Completed your first learning module step.',
    iconName: 'Footprints',
    tier: 'BRONZE',
    xpBonus: 15,
  },
  {
    key: 'FIRST_COURSE',
    name: 'Course Graduate',
    description: 'Successfully completed a full certified training course.',
    iconName: 'GraduationCap',
    tier: 'SILVER',
    xpBonus: 50,
  },
  {
    key: 'QUIZ_MASTER',
    name: 'Quiz Master',
    description: 'Passed 3 or more competency evaluations or AI quizzes.',
    iconName: 'BrainCircuit',
    tier: 'SILVER',
    xpBonus: 30,
  },
  {
    key: 'CERT_CHAMPION',
    name: 'Certificate Champion',
    description: 'Submitted and verified an official certificate from SWAYAM, NPTEL, or recognized provider.',
    iconName: 'Award',
    tier: 'GOLD',
    xpBonus: 75,
  },
  {
    key: 'PATH_EXPLORER',
    name: 'Pathway Conqueror',
    description: 'Completed an entire personalized skill progression pathway.',
    iconName: 'Compass',
    tier: 'GOLD',
    xpBonus: 100,
  },
  {
    key: 'CONSISTENT_LEARNER',
    name: '7-Day Streak',
    description: 'Maintained 7 consecutive or milestone learning days.',
    iconName: 'Flame',
    tier: 'SILVER',
    xpBonus: 50,
  },
  {
    key: 'SKILL_CHAMPION',
    name: 'XP Titan',
    description: 'Accumulated over 500 total XP in the StatSkillAI reward ledger.',
    iconName: 'Trophy',
    tier: 'PLATINUM',
    xpBonus: 150,
  },
];

export async function evaluateBadges(
  userId: string,
  awardXPFunc: (userId: string, eventType: string, refId: string, options?: any) => Promise<any>
): Promise<string[]> {
  const newBadgesUnlocked: string[] = [];

  try {
    // 1. Fetch user's existing badges
    const existingBadges = await prisma.userBadge.findMany({
      where: { userId },
      select: { badgeKey: true },
    });
    const ownedKeys = new Set(existingBadges.map((b) => b.badgeKey));

    // 2. Fetch stats for badge evaluation
    const [balance, streak, completedSteps, completedCerts, quizzesCount, pathCompleted] = await Promise.all([
      prisma.rewardBalance.findUnique({ where: { userId } }),
      prisma.learnerStreak.findUnique({ where: { userId } }),
      prisma.learningStep.count({
        where: {
          learningPath: { userId },
          status: 'Completed',
        },
      }),
      prisma.certificate.count({
        where: { userId, status: 'APPROVED' },
      }),
      prisma.quizRecord.count({
        where: { userId },
      }),
      prisma.learningPath.findFirst({
        where: { userId, isCompleted: true },
      }),
    ]);

    const totalXp = balance?.totalEarned || 0;
    const currentStreak = streak?.currentStreak || 0;
    const totalActiveDays = streak?.totalActiveDays || 0;

    // Helper to award a badge if not already unlocked
    const tryUnlock = async (badgeKey: string) => {
      if (ownedKeys.has(badgeKey)) return;

      const badgeDef = INITIAL_BADGES.find((b) => b.key === badgeKey);
      if (!badgeDef) return;

      try {
        await prisma.userBadge.create({
          data: {
            userId,
            badgeKey,
          },
        });
        ownedKeys.add(badgeKey);
        newBadgesUnlocked.push(badgeKey);

        // Award badge XP bonus via isolated non-recursive call
        if (badgeDef.xpBonus > 0) {
          await awardXPFunc(
            userId,
            'BADGE_BONUS',
            `badge-${badgeKey}`,
            {
              amount: badgeDef.xpBonus,
              skipBadgeEvaluation: true, // STRICTLY PREVENTS RECURSIVE BADGE CALLS
              idempotencyKey: `badge-bonus:${userId}:${badgeKey}`,
              description: `Unlocked Badge: ${badgeDef.name} (+${badgeDef.xpBonus} XP Bonus)`,
            }
          );
        }
      } catch (err: any) {
        // Unique constraint violation P2002 means already unlocked concurrently
        if (err?.code !== 'P2002') {
          console.error(`Error unlocking badge ${badgeKey}:`, err);
        }
      }
    };

    // Check conditions
    if (completedSteps >= 1) await tryUnlock('FIRST_STEP');
    if (completedSteps >= 5) await tryUnlock('FIRST_COURSE');
    if (completedCerts >= 1) await tryUnlock('CERT_CHAMPION');
    if (quizzesCount >= 3) await tryUnlock('QUIZ_MASTER');
    if (pathCompleted) await tryUnlock('PATH_EXPLORER');
    if (currentStreak >= 7 || totalActiveDays >= 7) await tryUnlock('CONSISTENT_LEARNER');
    if (totalXp >= 500) await tryUnlock('SKILL_CHAMPION');

  } catch (err) {
    console.error('Badge evaluation error:', err);
  }

  return newBadgesUnlocked;
}
