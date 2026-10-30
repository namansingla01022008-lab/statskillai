import { Router, Response } from 'express';
import { prisma } from '../db';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { recalculateUserGapAnalysis } from './assessments';
import { awardXP } from '../services/rewardEngine';
import { recordLearnerActivity } from '../services/streakEngine';

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
        // Server-side courseId validation against verified database catalog
        let verifiedCourseId: string | null = null;
        let finalTitle = s.title;
        let finalSource = s.source || 'SWAYAM';
        let finalDomain = s.domain || 'Statistical';

        if (s.courseId) {
          const verifiedCourse = await prisma.course.findFirst({
            where: { id: s.courseId, status: 'verified' },
          });

          if (verifiedCourse) {
            verifiedCourseId = verifiedCourse.id;
            // Always overwrite with database title and provider
            finalTitle = verifiedCourse.title;
            finalSource = verifiedCourse.provider;
            finalDomain = verifiedCourse.domain;
          } else {
            console.warn(`[Path Save] Discarded unknown or unverified courseId "${s.courseId}".`);
            verifiedCourseId = null;
          }
        }

        await prisma.learningStep.create({
          data: {
            learningPathId: savedPath.id,
            title: finalTitle,
            domain: finalDomain,
            type: s.type || 'Course',
            estimatedDuration: s.estimatedDuration || '4 Weeks',
            source: finalSource,
            rationale: s.rationale || '',
            status: s.status || 'Not started',
            isAiSuggested: Boolean(s.isAiSuggested),
            isMentorRecommended: Boolean(s.isMentorRecommended),
            courseId: verifiedCourseId,
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
    if (status === 'Completed' && previousStatus !== 'Completed') {
      // 1. Verify associated course if courseId is present
      if (step.courseId) {
        const courseExists = await prisma.course.findUnique({ where: { id: step.courseId } });
        if (!courseExists) {
          console.warn(`Step ${step.id} has invalid courseId ${step.courseId}, continuing milestone check.`);
        }
      }

      // 2. Competency Score Boost (strictly preserved existing functionality)
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

      // 3. Reward Engine XP Hook & Activity Streak Hook (Independent System)
      try {
        recordLearnerActivity(userId).catch(() => {});
        await awardXP(userId, 'STEP_COMPLETE', step.id, {
          idempotencyKey: `step-done:${userId}:${step.id}`,
          description: `Completed module: ${step.title}`,
        });
      } catch (rewardErr) {
        console.warn('Reward processing caught safely:', rewardErr);
      }
    }

    // Recompute path progress
    const allSteps = await prisma.learningStep.findMany({
      where: { learningPathId: step.learningPathId },
    });
    const completedCount = allSteps.filter((s) => s.status === 'Completed').length;
    const progressPercent = allSteps.length ? Math.round((completedCount / allSteps.length) * 100) : 0;
    const isCompleted = allSteps.length > 0 && completedCount === allSteps.length;

    // Check if path became newly completed
    if (isCompleted && !step.learningPath.isCompleted) {
      try {
        await awardXP(userId, 'PATH_COMPLETE', step.learningPathId, {
          idempotencyKey: `path-done:${userId}:${step.learningPathId}`,
          description: `Completed full competency pathway: ${step.learningPath.title}`,
        });
      } catch (pathRewardErr) {
        console.warn('Path complete reward error:', pathRewardErr);
      }
    }

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


// POST Recommend verified courses via Gemini (Strict Candidate Subset & Server Verification)
router.post('/recommend-courses', authenticate, requireRole(['learner']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { domain, topic, level } = req.body;

    // 1. Backend queries verified candidates filtered by learner criteria
    const where: any = { status: 'verified' };
    if (domain) where.domain = domain;
    if (topic) where.topic = topic;
    if (level) where.level = level;

    const verifiedCandidates = await prisma.course.findMany({
      where,
      select: {
        id: true,
        title: true,
        topic: true,
        level: true,
        domain: true,
        provider: true,
        sourceUrl: true,
        sourceName: true,
        duration: true,
        lastVerifiedAt: true,
      },
    });

    if (verifiedCandidates.length === 0) {
      return res.json({
        success: true,
        recommendations: [],
        message: 'No verified recommendation available.',
      });
    }

    const candidateMap = new Map(verifiedCandidates.map((c) => [c.id, c]));

    // 2. Send ONLY (id, title, topic, level) to Gemini
    const minimalCandidates = verifiedCandidates.map((c) => ({
      id: c.id,
      title: c.title,
      topic: c.topic,
      level: c.level,
    }));

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const { GoogleGenAI, Type } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `Select the most suitable courses for a learner seeking development in ${domain || 'Statistics'}.
Available Verified Candidates:
${JSON.stringify(minimalCandidates, null, 2)}

CRITICAL INSTRUCTIONS:
- You may ONLY select course IDs from the provided candidate list.
- You are strictly FORBIDDEN from generating course names, URLs, institutions, or job postings.
- Return ONLY valid candidate IDs with a concise reason for each.`;

        const responseSchema = {
          type: Type.OBJECT,
          properties: {
            recommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  reason: { type: Type.STRING },
                },
                required: ['id', 'reason'],
              },
            },
          },
          required: ['recommendations'],
        };

        const result = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema,
          },
        });

        const parsed = JSON.parse(result.text || '{}');
        const rawRecs = Array.isArray(parsed.recommendations) ? parsed.recommendations : [];

        // 3. Server verifies every returned ID exists in the candidate set, discards unknown IDs,
        // and renders titles, links, and details from the database only, never from Gemini text.
        const verifiedRecs: any[] = [];
        for (const rec of rawRecs) {
          const dbRecord = candidateMap.get(rec.id);
          if (dbRecord) {
            verifiedRecs.push({
              id: dbRecord.id,
              title: dbRecord.title,
              topic: dbRecord.topic,
              level: dbRecord.level,
              domain: dbRecord.domain,
              provider: dbRecord.provider,
              sourceUrl: dbRecord.sourceUrl,
              sourceName: dbRecord.sourceName,
              duration: dbRecord.duration,
              lastVerifiedAt: dbRecord.lastVerifiedAt,
              reason: rec.reason,
            });
          } else {
            console.warn(`[Gemini Validation] Discarded unknown or fabricated ID: "${rec.id}"`);
          }
        }

        if (verifiedRecs.length === 0) {
          return res.json({
            success: true,
            recommendations: [],
            message: 'No verified recommendation available.',
          });
        }

        return res.json({ success: true, recommendations: verifiedRecs });
      } catch (aiErr) {
        console.warn('Gemini recommendation call caught, falling back to database selection:', aiErr);
      }
    }

    // Deterministic fallback (offline or fallback required)
    const fallbackRecs = verifiedCandidates.slice(0, 3).map((c) => ({
      id: c.id,
      title: c.title,
      topic: c.topic,
      level: c.level,
      domain: c.domain,
      provider: c.provider,
      sourceUrl: c.sourceUrl,
      sourceName: c.sourceName,
      duration: c.duration,
      lastVerifiedAt: c.lastVerifiedAt,
      reason: `Verified official course in ${c.topic} matching your target competency benchmark.`,
    }));

    return res.json({ success: true, recommendations: fallbackRecs });
  } catch (err: any) {
    console.error('Recommend courses error:', err);
    res.status(500).json({ error: 'Failed to recommend courses.' });
  }
});

export default router;
