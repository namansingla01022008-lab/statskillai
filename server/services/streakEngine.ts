import { prisma } from '../db';
import { awardXP } from './rewardEngine';

export async function recordLearnerActivity(userId: string): Promise<{
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
  streakAwarded: boolean;
}> {
  try {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD in UTC
    const yesterdayDate = new Date();
    yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1);
    const yesterday = yesterdayDate.toISOString().slice(0, 10);

    let streak = await prisma.learnerStreak.findUnique({ where: { userId } });

    if (!streak) {
      streak = await prisma.learnerStreak.create({
        data: {
          userId,
          currentStreak: 1,
          lastActivityDate: today,
          longestStreak: 1,
          totalActiveDays: 1,
        },
      });
      return {
        currentStreak: 1,
        longestStreak: 1,
        totalActiveDays: 1,
        streakAwarded: false,
      };
    }

    // Already recorded activity today
    if (streak.lastActivityDate === today) {
      return {
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        totalActiveDays: streak.totalActiveDays,
        streakAwarded: false,
      };
    }

    let newCurrent = streak.currentStreak;
    let newLongest = streak.longestStreak;
    let newTotal = streak.totalActiveDays + 1;

    if (streak.lastActivityDate === yesterday) {
      // Consecutive day activity
      newCurrent += 1;
      if (newCurrent > newLongest) {
        newLongest = newCurrent;
      }
    } else {
      // Gap day - reset current streak back to 1
      newCurrent = 1;
    }

    const updatedStreak = await prisma.learnerStreak.update({
      where: { userId },
      data: {
        currentStreak: newCurrent,
        longestStreak: newLongest,
        totalActiveDays: newTotal,
        lastActivityDate: today,
      },
    });

    // Check for recurring 7-day milestone
    // Each completed 7-day block yields an award
    let streakAwarded = false;
    const weekNumber = Math.floor(updatedStreak.totalActiveDays / 7);
    if (weekNumber > 0 && updatedStreak.totalActiveDays % 7 === 0) {
      const idempotencyKey = `streak-7:${userId}:week-${weekNumber}`;
      const awardResult = await awardXP(
        userId,
        'STREAK_7DAY',
        `streak-week-${weekNumber}`,
        {
          idempotencyKey,
          description: `Achieved 7-day learning consistency milestone (Cycle #${weekNumber})`,
        }
      );
      streakAwarded = awardResult.awarded;

      if (streakAwarded) {
        await prisma.learnerStreak.update({
          where: { userId },
          data: { lastStreakAwardedAt: new Date() },
        });
      }
    }

    return {
      currentStreak: updatedStreak.currentStreak,
      longestStreak: updatedStreak.longestStreak,
      totalActiveDays: updatedStreak.totalActiveDays,
      streakAwarded,
    };
  } catch (err) {
    console.error('Streak update error:', err);
    return {
      currentStreak: 1,
      longestStreak: 1,
      totalActiveDays: 1,
      streakAwarded: false,
    };
  }
}
