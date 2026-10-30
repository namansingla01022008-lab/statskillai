import { Router, Response } from 'express';
import { prisma } from '../db';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { awardXP } from '../services/rewardEngine';
import { recordLearnerActivity } from '../services/streakEngine';

const router = Router();

// GET all quizzes for user
router.get('/', authenticate, requireRole(['learner', 'admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const quizzes = await prisma.quizRecord.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
    });

    const parsed = quizzes.map((q) => ({
      ...q,
      questions: JSON.parse(q.questions || '[]'),
      userAnswers: JSON.parse(q.userAnswers || '[]'),
    }));

    res.json({ success: true, quizzes: parsed });
  } catch (err: any) {
    console.error('Fetch quizzes error:', err);
    res.status(500).json({ error: 'Failed to fetch quizzes.' });
  }
});

// POST save completed quiz
router.post('/', authenticate, requireRole(['learner']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { title, sourceType, sourceSnippet, difficulty, questions, userAnswers, score, totalQuestions } = req.body;

    const quiz = await prisma.quizRecord.create({
      data: {
        userId,
        title: title || 'Custom Document Quiz',
        sourceType: sourceType || 'text',
        sourceSnippet: (sourceSnippet || '').slice(0, 500),
        difficulty: difficulty || 'Mixed',
        questions: JSON.stringify(questions || []),
        userAnswers: JSON.stringify(userAnswers || []),
        score: typeof score === 'number' ? score : 0,
        totalQuestions: typeof totalQuestions === 'number' ? totalQuestions : 5,
      },
    });

    // Non-blocking Reward Engine & Streak Hook
    let rewardResult: any = null;
    try {
      recordLearnerActivity(userId).catch(() => {});
      const passRate = quiz.totalQuestions > 0 ? quiz.score / quiz.totalQuestions : 0;
      if (passRate >= 0.6) {
        rewardResult = await awardXP(userId, 'QUIZ_PASS', quiz.id, {
          idempotencyKey: `quiz-pass:${userId}:${quiz.id}`,
          description: `Passed AI Assessment Quiz: ${quiz.title} (${Math.round(passRate * 100)}%)`,
        });
      }
    } catch (rewardErr) {
      console.warn('Quiz reward processing caught safely:', rewardErr);
    }

    res.status(201).json({
      success: true,
      quiz: {
        ...quiz,
        questions: JSON.parse(quiz.questions),
        userAnswers: JSON.parse(quiz.userAnswers),
      },
      reward: rewardResult,
    });
  } catch (err: any) {
    console.error('Save quiz error:', err);
    res.status(500).json({ error: 'Failed to save quiz record.' });
  }
});

export default router;
