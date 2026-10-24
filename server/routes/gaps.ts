import { Router, Response } from 'express';
import { prisma } from '../db';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET Gap Analysis
router.get('/', authenticate, requireRole(['learner', 'admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const gap = await prisma.gapAnalysis.findUnique({
      where: { userId },
    });

    if (!gap) {
      return res.json({ success: true, analysis: null });
    }

    res.json({
      success: true,
      analysis: {
        ...gap,
        strengths: JSON.parse(gap.strengths || '[]'),
        gaps: JSON.parse(gap.gaps || '[]'),
        priorityOrder: JSON.parse(gap.priorityOrder || '[]'),
        domainScores: JSON.parse(gap.domainScores || '{}'),
        targetScores: JSON.parse(gap.targetScores || '{}'),
      },
    });
  } catch (err: any) {
    console.error('Fetch gap analysis error:', err);
    res.status(500).json({ error: 'Failed to fetch gap analysis.' });
  }
});

// POST Save Gap Analysis
router.post('/save', authenticate, requireRole(['learner']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { strengths, gaps, summary, priorityOrder, domainScores, targetScores, overallScore } = req.body;

    const saved = await prisma.gapAnalysis.upsert({
      where: { userId },
      update: {
        timestamp: new Date(),
        strengths: JSON.stringify(strengths || []),
        gaps: JSON.stringify(gaps || []),
        summary: summary || '',
        priorityOrder: JSON.stringify(priorityOrder || []),
        domainScores: JSON.stringify(domainScores || {}),
        targetScores: JSON.stringify(targetScores || {}),
        overallScore: typeof overallScore === 'number' ? overallScore : 0,
      },
      create: {
        userId,
        timestamp: new Date(),
        strengths: JSON.stringify(strengths || []),
        gaps: JSON.stringify(gaps || []),
        summary: summary || '',
        priorityOrder: JSON.stringify(priorityOrder || []),
        domainScores: JSON.stringify(domainScores || {}),
        targetScores: JSON.stringify(targetScores || {}),
        overallScore: typeof overallScore === 'number' ? overallScore : 0,
      },
    });

    res.json({
      success: true,
      analysis: {
        ...saved,
        strengths: JSON.parse(saved.strengths),
        gaps: JSON.parse(saved.gaps),
        priorityOrder: JSON.parse(saved.priorityOrder),
        domainScores: JSON.parse(saved.domainScores),
        targetScores: JSON.parse(saved.targetScores),
      },
    });
  } catch (err: any) {
    console.error('Save gap analysis error:', err);
    res.status(500).json({ error: 'Failed to save gap analysis.' });
  }
});

export default router;
