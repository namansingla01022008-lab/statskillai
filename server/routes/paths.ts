import { Router, Response } from 'express';
import { prisma } from '../db';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { recalculateUserGapAnalysis } from './assessments';

const router = Router();

// GET Learning Path
router.get('/', authenticate, requireRole(['learner', 'admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const path = await prisma.learningPath.findUnique({
      where: { userId },
      include: {
        steps: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!path) {
      return res.json({ success: true, learningPath: null });
    }

    res.json({ success: true, learningPath: path });
  } catch (err: any) {
    console.error('Fetch path error:', err);
    res.status(500).json({ error: 'Failed to fetch learning path.' });
  }
});

// POST Save/Regenerate Learning Path (Preserves mentor-recommended steps across AI regenerations)
router.post('/save', authenticate, requireRole(['learner']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { title, careerGoal, steps } = req.body;

    const savedPath = await prisma.learningPath.upsert({
      where: { userId },
      update: {
        title: title || 'Competency Pathway',
        careerGoal: careerGoal || '',
      },
      create: {
        userId,
        title: title || 'Competency Pathway',
        careerGoal: careerGoal || '',
        progressPercent: 0,
        isCompleted: false,
      },
    });

    // 1. Preserve existing mentor-recommended steps before clearing AI steps
    const existingMentorSteps = await prisma.learningStep.findMany({
      where: { learningPathId: savedPath.id, isMentorRecommended: true },
    });

    // Clear previous steps
    await prisma.learningStep.deleteMany({ where: { learningPathId: savedPath.id } });

    // Combine incoming steps with preserved mentor steps (avoid duplicates by title)
    const incomingSteps = Array.isArray(steps) ? [...steps] : [];
    for (const mentorStep of existingMentorSteps) {
      const alreadyPresent = incomingSteps.some((s: any) => s.title?.trim() === mentorStep.title?.trim());
      if (!alreadyPresent) {
        incomingSteps.unshift({
          title: mentorStep.title,
          domain: mentorStep.domain,
          type: mentorStep.type,
          estimatedDuration: mentorStep.estimatedDuration,
          source: mentorStep.source,
          rationale: mentorStep.rationale,
          status: mentorStep.status,
          isAiSuggested: false,
          isMentorRecommended: true,
          courseId: mentorStep.courseId,
        });
      }
    }

    if (incomingSteps.length > 0) {
      for (let i = 0; i < incomingSteps.length; i++) {
        const s = incomingSteps[i];
        await prisma.learningStep.create({
          data: {
            learningPathId: savedPath.id,
            title: s.title,
            domain: s.domain,
            type: s.type || 'Course',
            estimatedDuration: s.estimatedDuration || '4 Weeks',
            source: s.source || 'SWAYAM',
            rationale: s.rationale || '',
            status: s.status || 'Not started',
            isAiSuggested: Boolean(s.isAiSuggested),
            isMentorRecommended: Boolean(s.isMentorRecommended),
            courseId: s.courseId || null,
            orderIndex: i,
          },
        });
      }
    }

    // Recompute path progress
    const allSteps = await prisma.learningStep.findMany({
      where: { learningPathId: savedPath.id },
      orderBy: { orderIndex: 'asc' },
    });
    const completedCount = allSteps.filter((s) => s.status === 'Completed').length;
    const progressPercent = allSteps.length ? Math.round((completedCount / allSteps.length) * 100) : 0;
    const isCompleted = allSteps.length > 0 && completedCount === allSteps.length;

    const fullPath = await prisma.learningPath.update({
      where: { id: savedPath.id },
      data: { progressPercent, isCompleted },
      include: { steps: { orderBy: { orderIndex: 'asc' } } },
    });

    res.json({ success: true, learningPath: fullPath });
  } catch (err: any) {
    console.error('Save path error:', err);
    res.status(500).json({ error: 'Failed to save learning path.' });
  }
});

// PATCH Update Step Status -> Closed-loop feedback: awards competency points and recomputes gaps
router.patch('/step-status', authenticate, requireRole(['learner']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { stepId, status } = req.body;

    if (!stepId || !status) {
      return res.status(400).json({ error: 'stepId and status are required.' });
    }

    const step = await prisma.learningStep.findUnique({
      where: { id: stepId },
      include: { learningPath: true },
    });

    if (!step || step.learningPath.userId !== userId) {
      return res.status(404).json({ error: 'Learning step not found or unauthorized.' });
    }

    const previousStatus = step.status;

    await prisma.learningStep.update({
      where: { id: stepId },
      data: { status },
    });

    // Closed-loop competency feedback: If newly marked as Completed, award +3 competency points to that domain
    if (status === 'Completed' && previousStatus !== 'Completed' && step.domain) {
      const latestAttempt = await prisma.assessmentAttempt.findFirst({
        where: { userId, domain: step.domain, completed: true },
        orderBy: { date: 'desc' },
      });

      const currentScore = latestAttempt ? latestAttempt.score : 65;
      const boostedScore = Math.min(98, currentScore + 3);

      await prisma.assessmentAttempt.create({
        data: {
          userId,
          domain: step.domain,
          score: boostedScore,
          earnedWeight: 10,
          maxWeight: 10,
          previousScore: currentScore,
          questions: JSON.stringify([{
            id: `milestone-${Date.now()}`,
            question: `Completed competency module: ${step.title}`,
            domain: step.domain,
            difficulty: 'Medium',
            options: ['Completed verified training milestone'],
            correctIndex: 0,
            explanation: 'Verified progress milestone from personalized learning pathway.',
          }]),
          userAnswers: JSON.stringify([0]),
          completed: true,
        },
      });

      // Automatically recalculate gaps and domain benchmarks
      await recalculateUserGapAnalysis(userId);
    }

    // Recompute path progress
    const allSteps = await prisma.learningStep.findMany({
      where: { learningPathId: step.learningPathId },
    });
    const completedCount = allSteps.filter((s) => s.status === 'Completed').length;
    const progressPercent = allSteps.length ? Math.round((completedCount / allSteps.length) * 100) : 0;
    const isCompleted = allSteps.length > 0 && completedCount === allSteps.length;

    const updatedPath = await prisma.learningPath.update({
      where: { id: step.learningPathId },
      data: { progressPercent, isCompleted },
      include: { steps: { orderBy: { orderIndex: 'asc' } } },
    });

    res.json({ success: true, learningPath: updatedPath });
  } catch (err: any) {
    console.error('Update step status error:', err);
    res.status(500).json({ error: 'Failed to update step status.' });
  }
});

export default router;
