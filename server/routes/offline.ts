import { Router, Response } from 'express';
import { prisma } from '../db';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { recalculateUserGapAnalysis } from './assessments';
import {
  getSanitizedPreloadedQuestions,
  scoreOfflineAttempt,
} from '../services/questionBank';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiter for sync endpoint
const syncLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60, // 60 sync batches per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Sync rate limit exceeded. Please wait a few minutes before syncing again.' },
});

// In-memory idempotency cache for processed mutation IDs (stores last 5,000 processed mutations)
const processedMutations = new Map<string, { status: string; result?: any; error?: string }>();

// GET /api/offline/questions -> Returns preloaded question set (text & options ONLY, zero answers or keys)
router.get('/questions', (req, res) => {
  try {
    const questions = getSanitizedPreloadedQuestions();
    res.json({
      success: true,
      version: 'v1',
      count: questions.length,
      questions,
    });
  } catch (err: any) {
    console.error('Fetch preloaded questions error:', err);
    res.status(500).json({ error: 'Failed to fetch preloaded offline questions.' });
  }
});

// POST /api/offline/sync -> Processes batched mutations from client outbox
router.post('/sync', authenticate, requireRole(['learner']), syncLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { mutations } = req.body;

    if (!Array.isArray(mutations)) {
      return res.status(400).json({ error: 'mutations must be an array.' });
    }

    if (mutations.length > 50) {
      return res.status(400).json({ error: 'Batch size exceeds 50 mutations limit.' });
    }

    const results: Array<{
      mutationId: string;
      status: 'synced' | 'failed' | 'skipped';
      result?: any;
      error?: string;
    }> = [];

    for (const m of mutations) {
      if (!m.mutationId || !m.type || !m.payload) {
        results.push({
          mutationId: m.mutationId || 'unknown',
          status: 'failed',
          error: 'Malformed mutation: missing required fields.',
        });
        continue;
      }

      // 1. Idempotency Check: if previously processed, return stored result
      if (processedMutations.has(m.mutationId)) {
        const cached = processedMutations.get(m.mutationId)!;
        results.push({
          mutationId: m.mutationId,
          status: cached.status as any,
          result: cached.result,
          error: cached.error,
        });
        continue;
      }

      // 2. Process STEP_COMPLETE Mutation
      if (m.type === 'STEP_COMPLETE') {
        try {
          const { stepId, status } = m.payload;
          if (!stepId) {
            const errRes = { mutationId: m.mutationId, status: 'failed' as const, error: 'stepId is required.' };
            processedMutations.set(m.mutationId, errRes);
            results.push(errRes);
            continue;
          }

          const step = await prisma.learningStep.findUnique({
            where: { id: stepId },
            include: { learningPath: true },
          });

          // Monotonic / conflict check: if step was deleted by path regeneration, skip gracefully
          if (!step || step.learningPath.userId !== userId) {
            const skipRes = {
              mutationId: m.mutationId,
              status: 'skipped' as const,
              result: { stepId, reason: 'Step no longer exists in active learning path.' },
            };
            processedMutations.set(m.mutationId, skipRes);
            results.push(skipRes);
            continue;
          }

          const previousStatus = step.status;
          // Monotonic rule: 'Completed' status is never reverted by older offline events
          if (previousStatus === 'Completed') {
            const okRes = {
              mutationId: m.mutationId,
              status: 'synced' as const,
              result: { stepId, status: 'Completed', note: 'Already completed on server.' },
            };
            processedMutations.set(m.mutationId, okRes);
            results.push(okRes);
            continue;
          }

          await prisma.learningStep.update({
            where: { id: stepId },
            data: { status: 'Completed' },
          });

          // Award +3 domain competency points if newly completed
          if (step.domain) {
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
                earnedWeight: 3,
                maxWeight: 3,
                previousScore: currentScore,
                questions: JSON.stringify([{ title: step.title, type: step.type }]),
                userAnswers: JSON.stringify([1]),
                completed: true,
              },
            });

            await recalculateUserGapAnalysis(userId);
          }

          const successRes = {
            mutationId: m.mutationId,
            status: 'synced' as const,
            result: { stepId, status: 'Completed', serverUpdated: true },
          };
          processedMutations.set(m.mutationId, successRes);
          results.push(successRes);
        } catch (stepErr: any) {
          console.error('Offline step sync error:', stepErr);
          const errRes = { mutationId: m.mutationId, status: 'failed' as const, error: stepErr.message };
          processedMutations.set(m.mutationId, errRes);
          results.push(errRes);
        }
        continue;
      }

      // 3. Process ASSESSMENT_SUBMIT Mutation
      if (m.type === 'ASSESSMENT_SUBMIT') {
        try {
          const { attemptId, domain, questionSetVersion, answers, startedAt, submittedAt } = m.payload;

          if (!attemptId || !domain) {
            const errRes = { mutationId: m.mutationId, status: 'failed' as const, error: 'attemptId and domain are required.' };
            processedMutations.set(m.mutationId, errRes);
            results.push(errRes);
            continue;
          }

          // Idempotency check: see if attempt was already created in PostgreSQL
          const existingAttempt = await prisma.assessmentAttempt.findUnique({
            where: { id: attemptId },
          });

          if (existingAttempt) {
            const existingRes = {
              mutationId: m.mutationId,
              status: 'synced' as const,
              result: {
                attemptId: existingAttempt.id,
                score: existingAttempt.score,
                domain: existingAttempt.domain,
                note: 'Idempotent replay: attempt already registered.',
              },
            };
            processedMutations.set(m.mutationId, existingRes);
            results.push(existingRes);
            continue;
          }

          // Server-side authoritative re-scoring and validation
          const scored = scoreOfflineAttempt({
            domain,
            questionSetVersion: questionSetVersion || 'v1',
            answers: answers || [],
            startedAt,
            submittedAt,
          });

          if (!scored.valid) {
            const errRes = {
              mutationId: m.mutationId,
              status: 'failed' as const,
              error: scored.error || 'Server validation rejected offline assessment attempt.',
            };
            processedMutations.set(m.mutationId, errRes);
            results.push(errRes);
            continue;
          }

          // Fetch previous score for progress differential
          const prevAttempt = await prisma.assessmentAttempt.findFirst({
            where: { userId, domain, completed: true },
            orderBy: { date: 'desc' },
          });

          const createdAttempt = await prisma.assessmentAttempt.create({
            data: {
              id: attemptId,
              userId,
              domain,
              score: scored.score,
              earnedWeight: scored.earnedWeight,
              maxWeight: scored.maxWeight,
              previousScore: prevAttempt ? prevAttempt.score : null,
              questions: JSON.stringify(scored.questionRecords),
              userAnswers: JSON.stringify(scored.userAnswers),
              date: new Date(submittedAt),
              completed: true,
            },
          });

          // Trigger closed-loop diagnostic recalculation
          const updatedGap = await recalculateUserGapAnalysis(userId);

          const successRes = {
            mutationId: m.mutationId,
            status: 'synced' as const,
            result: {
              attemptId: createdAttempt.id,
              score: createdAttempt.score,
              domain: createdAttempt.domain,
              earnedWeight: createdAttempt.earnedWeight,
              maxWeight: createdAttempt.maxWeight,
              gapAnalysis: updatedGap,
            },
          };
          processedMutations.set(m.mutationId, successRes);
          results.push(successRes);
        } catch (assessErr: any) {
          console.error('Offline assessment sync error:', assessErr);
          const errRes = { mutationId: m.mutationId, status: 'failed' as const, error: assessErr.message };
          processedMutations.set(m.mutationId, errRes);
          results.push(errRes);
        }
        continue;
      }

      // 4. Any other mutation type is rejected (offline writes strictly restricted to the 2 actions)
      const unknownRes = {
        mutationId: m.mutationId,
        status: 'failed' as const,
        error: `Mutation type "${m.type}" is not permitted in offline sync.`,
      };
      processedMutations.set(m.mutationId, unknownRes);
      results.push(unknownRes);
    }

    res.json({
      success: true,
      processed: results,
      syncedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Offline sync batch error:', err);
    res.status(500).json({ error: 'Internal server error processing offline sync.' });
  }
});

export default router;

