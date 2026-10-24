import { Router, Response } from 'express';
import { prisma } from '../db';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET user's assessment attempts
router.get('/attempts', authenticate, requireRole(['learner', 'admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const domain = req.query.domain as string | undefined;

    const where: any = { userId, completed: true };
    if (domain) {
      where.domain = domain;
    }

    const attempts = await prisma.assessmentAttempt.findMany({
      where,
      orderBy: { date: 'desc' },
      take: 20,
    });

    const parsedAttempts = attempts.map((a) => ({
      ...a,
      questions: JSON.parse(a.questions || '[]'),
      userAnswers: JSON.parse(a.userAnswers || '[]'),
    }));

    res.json({ success: true, attempts: parsedAttempts });
  } catch (err: any) {
    console.error('Fetch attempts error:', err);
    res.status(500).json({ error: 'Failed to fetch assessment attempts.' });
  }
});

// Helper function to automatically compute and upsert GapAnalysis based on latest assessment scores
export async function recalculateUserGapAnalysis(userId: string) {
  const attempts = await prisma.assessmentAttempt.findMany({
    where: { userId, completed: true },
    orderBy: { date: 'desc' },
  });

  const domainScores: Record<string, number> = {
    Technical: 60,
    Statistical: 60,
    Digital: 60,
    Behavioural: 60,
  };

  ['Technical', 'Statistical', 'Digital', 'Behavioural'].forEach((d) => {
    const match = attempts.find((a) => a.domain === d);
    if (match) domainScores[d] = match.score;
  });

  const profile = await prisma.learnerProfile.findUnique({ where: { userId } });
  let targetScores: Record<string, number> = {
    Technical: 70,
    Statistical: 70,
    Digital: 70,
    Behavioural: 70,
  };
  if (profile?.targetDomainScores) {
    try {
      targetScores = JSON.parse(profile.targetDomainScores);
    } catch {}
  }

  const DOMAIN_SKILLS: Record<string, string> = {
    Statistical: 'Survey Sampling & NSSO Methodology',
    Technical: 'Data Processing Pipelines & Python/SQL',
    Digital: 'E-Governance, DPI & DPDP Standards',
    Behavioural: 'Public Leadership Ethics & Citizen Communication',
  };

  const gaps: Array<{
    id: string;
    domain: string;
    skill: string;
    currentScore: number;
    targetScore: number;
    gap: number;
    severity: 'High' | 'Medium' | 'Low';
    priority: number;
    rationale: string;
  }> = [];

  const strengths: string[] = [];
  let totalScoreSum = 0;
  let priorityCounter = 1;

  for (const domain of ['Statistical', 'Technical', 'Digital', 'Behavioural']) {
    const current = domainScores[domain] || 0;
    const target = targetScores[domain] || 70;
    totalScoreSum += current;
    const diff = target - current;

    if (diff > 0) {
      const severity: 'High' | 'Medium' | 'Low' = diff >= 25 ? 'High' : diff >= 15 ? 'Medium' : 'Low';
      gaps.push({
        id: `gap-${domain.toLowerCase()}`,
        domain,
        skill: DOMAIN_SKILLS[domain] || domain,
        currentScore: current,
        targetScore: target,
        gap: diff,
        severity,
        priority: priorityCounter++,
        rationale: `Deficiency of ${diff} points below target benchmark in ${domain}.`,
      });
    } else {
      strengths.push(`${domain}: Competency exceeds target benchmark (+${Math.abs(diff)} pts).`);
    }
  }

  gaps.sort((a, b) => b.gap - a.gap);
  const priorityOrder = gaps.map((g) => g.domain);
  const overallScore = Math.round(totalScoreSum / 4);
  const summary = gaps.length > 0
    ? `Automated diagnostic identified ${gaps.length} deficiency areas. Immediate intervention recommended for ${priorityOrder[0]}.`
    : 'All competencies meet or exceed official target benchmarks.';

  const gapAnalysis = await prisma.gapAnalysis.upsert({
    where: { userId },
    update: {
      timestamp: new Date(),
      strengths: JSON.stringify(strengths),
      gaps: JSON.stringify(gaps),
      summary,
      priorityOrder: JSON.stringify(priorityOrder),
      domainScores: JSON.stringify(domainScores),
      targetScores: JSON.stringify(targetScores),
      overallScore,
    },
    create: {
      userId,
      timestamp: new Date(),
      strengths: JSON.stringify(strengths),
      gaps: JSON.stringify(gaps),
      summary,
      priorityOrder: JSON.stringify(priorityOrder),
      domainScores: JSON.stringify(domainScores),
      targetScores: JSON.stringify(targetScores),
      overallScore,
    },
  });

  return {
    ...gapAnalysis,
    strengths,
    gaps,
    priorityOrder,
    domainScores,
    targetScores,
  };
}

// POST submit a completed assessment attempt
router.post('/submit', authenticate, requireRole(['learner']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { domain, questions, userAnswers, score, earnedWeight, maxWeight, previousScore } = req.body;

    if (!domain || score === undefined) {
      return res.status(400).json({ error: 'domain and score are required.' });
    }

    const attempt = await prisma.assessmentAttempt.create({
      data: {
        userId,
        domain,
        score: Math.max(0, Math.min(100, Math.round(score))),
        earnedWeight: earnedWeight || 0,
        maxWeight: maxWeight || 0,
        previousScore: previousScore !== undefined ? previousScore : null,
        questions: JSON.stringify(questions || []),
        userAnswers: JSON.stringify(userAnswers || []),
        completed: true,
      },
    });

    // Automatically trigger closed-loop diagnostic recalculation
    const updatedGapAnalysis = await recalculateUserGapAnalysis(userId);

    res.status(201).json({
      success: true,
      attempt: {
        ...attempt,
        questions: JSON.parse(attempt.questions),
        userAnswers: JSON.parse(attempt.userAnswers),
      },
      gapAnalysis: updatedGapAnalysis,
    });
  } catch (err: any) {
    console.error('Submit attempt error:', err);
    res.status(500).json({ error: 'Failed to record assessment attempt.' });
  }
});

export default router;
