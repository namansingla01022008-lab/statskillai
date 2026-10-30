import { Router, Response } from 'express';
import { prisma } from '../db';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { redeemReward } from '../services/rewardEngine';
import { INITIAL_BADGES } from '../services/badgeEngine';

const router = Router();

// GET /api/rewards/balance - Current learner XP balance
router.get('/balance', authenticate, requireRole(['learner', 'admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const balance = await prisma.rewardBalance.findUnique({
      where: { userId },
    });

    res.json({
      success: true,
      balance: balance?.balance || 0,
      totalEarned: balance?.totalEarned || 0,
      totalRedeemed: balance?.totalRedeemed || 0,
    });
  } catch (err: any) {
    console.error('Fetch balance error:', err);
    res.status(500).json({ error: 'Failed to fetch reward balance.' });
  }
});

// GET /api/rewards/history - XP ledger transactions
router.get('/history', authenticate, requireRole(['learner', 'admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const limit = Math.min(50, Number(req.query.limit) || 20);
    const page = Math.max(1, Number(req.query.page) || 1);
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      prisma.rewardTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      prisma.rewardTransaction.count({ where: { userId } }),
    ]);

    res.json({
      success: true,
      transactions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err: any) {
    console.error('Fetch reward history error:', err);
    res.status(500).json({ error: 'Failed to fetch transaction history.' });
  }
});

// GET /api/rewards/store - Active catalog rewards
router.get('/store', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const rewards = await prisma.reward.findMany({
      where: { isActive: true },
      orderBy: { xpCost: 'asc' },
    });

    res.json({ success: true, rewards });
  } catch (err: any) {
    console.error('Fetch rewards store error:', err);
    res.status(500).json({ error: 'Failed to fetch store rewards.' });
  }
});

// POST /api/rewards/redeem - Redeem XP for a voucher/resource
router.post('/redeem', authenticate, requireRole(['learner']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { rewardId, idempotencyKey } = req.body;

    if (!rewardId) {
      return res.status(400).json({ error: 'rewardId is required.' });
    }

    const result = await redeemReward(userId, rewardId, idempotencyKey);

    if (!result.success) {
      const status = result.refunded ? 409 : 400;
      return res.status(status).json({
        success: false,
        error: result.error,
        refunded: result.refunded,
      });
    }

    res.status(201).json({
      success: true,
      redemption: result.redemption,
      message: 'Redemption successful! Your reward details are ready.',
    });
  } catch (err: any) {
    console.error('Redemption error:', err);
    res.status(500).json({ error: 'Failed to process redemption.' });
  }
});

// GET /api/rewards/redemptions - Current user's redemptions
router.get('/redemptions', authenticate, requireRole(['learner', 'admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const redemptions = await prisma.redemption.findMany({
      where: { userId },
      include: {
        reward: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, redemptions });
  } catch (err: any) {
    console.error('Fetch redemptions error:', err);
    res.status(500).json({ error: 'Failed to fetch redemption history.' });
  }
});

// GET /api/rewards/badges - Badges definitions + user's earned badges
router.get('/badges', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const [userBadges, catalogBadges] = await Promise.all([
      prisma.userBadge.findMany({
        where: { userId },
        orderBy: { earnedAt: 'desc' },
      }),
      prisma.badge.findMany(),
    ]);

    // Use catalog badges or fallback to initial constants
    const allBadges = catalogBadges.length > 0 ? catalogBadges : INITIAL_BADGES;
    const earnedKeys = new Set(userBadges.map((ub) => ub.badgeKey));

    const responseBadges = allBadges.map((b) => {
      const earned = userBadges.find((ub) => ub.badgeKey === b.key);
      return {
        ...b,
        isEarned: earnedKeys.has(b.key),
        earnedAt: earned?.earnedAt || null,
      };
    });

    res.json({
      success: true,
      badges: responseBadges,
      earnedCount: userBadges.length,
      totalCount: allBadges.length,
    });
  } catch (err: any) {
    console.error('Fetch badges error:', err);
    res.status(500).json({ error: 'Failed to fetch badges.' });
  }
});

// GET /api/rewards/streak - Current user learning streak stats
router.get('/streak', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const streak = await prisma.learnerStreak.findUnique({
      where: { userId },
    });

    res.json({
      success: true,
      currentStreak: streak?.currentStreak || 0,
      longestStreak: streak?.longestStreak || 0,
      totalActiveDays: streak?.totalActiveDays || 0,
      lastActivityDate: streak?.lastActivityDate || null,
    });
  } catch (err: any) {
    console.error('Fetch streak error:', err);
    res.status(500).json({ error: 'Failed to fetch streak information.' });
  }
});

// GET /api/rewards/leaderboard - Top learners with period filter and privacy protections
router.get('/leaderboard', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const period = (req.query.period as string) || 'alltime';
    const limit = Math.min(25, Number(req.query.limit) || 10);

    // Format privacy-safe display name (e.g. "Aarav S.")
    const formatSafeName = (fullName: string) => {
      const parts = (fullName || 'Anonymous').trim().split(/\s+/);
      if (parts.length === 1) return parts[0];
      return `${parts[0]} ${parts[parts.length - 1][0]}.`;
    };

    if (period === 'weekly' || period === 'monthly') {
      const startDate = new Date();
      if (period === 'weekly') {
        const day = startDate.getUTCDay();
        const diff = startDate.getUTCDate() - day + (day === 0 ? -6 : 1); // Monday
        startDate.setUTCDate(diff);
        startDate.setUTCHours(0, 0, 0, 0);
      } else {
        startDate.setUTCDate(1);
        startDate.setUTCHours(0, 0, 0, 0);
      }

      // Group by user
      const transactions = await prisma.rewardTransaction.groupBy({
        by: ['userId'],
        where: {
          type: 'EARN',
          createdAt: { gte: startDate },
        },
        _sum: { xpAmount: true },
        orderBy: {
          _sum: { xpAmount: 'desc' },
        },
        take: limit,
      });

      const userIds = transactions.map((t) => t.userId);
      const [users, badges] = await Promise.all([
        prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, department: true },
        }),
        prisma.userBadge.groupBy({
          by: ['userId'],
          where: { userId: { in: userIds } },
          _count: { badgeKey: true },
        }),
      ]);

      const userMap = new Map(users.map((u) => [u.id, u]));
      const badgeMap = new Map(badges.map((b) => [b.userId, b._count.badgeKey]));

      const leaderboard = transactions.map((t, idx) => {
        const u = userMap.get(t.userId);
        return {
          rank: idx + 1,
          userId: t.userId,
          displayName: formatSafeName(u?.name || 'Anonymous'),
          department: u?.department || 'StatSkill Learner',
          xp: t._sum.xpAmount || 0,
          badgeCount: badgeMap.get(t.userId) || 0,
        };
      });

      return res.json({ success: true, period, leaderboard });
    }

    // Default 'alltime' ranking based on totalEarned in RewardBalance
    const balances = await prisma.rewardBalance.findMany({
      orderBy: { totalEarned: 'desc' },
      take: limit,
    });

    const userIds = balances.map((b) => b.userId);
    const [users, badges] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, department: true },
      }),
      prisma.userBadge.groupBy({
        by: ['userId'],
        where: { userId: { in: userIds } },
        _count: { badgeKey: true },
      }),
    ]);

    const userMap = new Map(users.map((u) => [u.id, u]));
    const badgeMap = new Map(badges.map((b) => [b.userId, b._count.badgeKey]));

    const leaderboard = balances.map((b, idx) => {
      const u = userMap.get(b.userId);
      return {
        rank: idx + 1,
        userId: b.userId,
        displayName: formatSafeName(u?.name || 'Anonymous'),
        department: u?.department || 'StatSkill Learner',
        xp: b.totalEarned,
        badgeCount: badgeMap.get(b.userId) || 0,
      };
    });

    res.json({ success: true, period: 'alltime', leaderboard });
  } catch (err: any) {
    console.error('Fetch leaderboard error:', err);
    res.status(500).json({ error: 'Failed to fetch leaderboard.' });
  }
});

export default router;
