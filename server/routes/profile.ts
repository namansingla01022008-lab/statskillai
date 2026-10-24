import { Router, Response } from 'express';
import { prisma } from '../db';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET Profile
router.get('/', authenticate, requireRole(['learner', 'admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const profile = await prisma.learnerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found.' });
    }

    res.json({
      success: true,
      profile: {
        ...profile,
        skills: JSON.parse(profile.skills || '[]'),
        interests: JSON.parse(profile.interests || '[]'),
        previousTrainings: JSON.parse(profile.previousTrainings || '[]'),
        targetDomainScores: JSON.parse(profile.targetDomainScores || '{}'),
      },
    });
  } catch (err: any) {
    console.error('Fetch profile error:', err);
    res.status(500).json({ error: 'Failed to fetch profile.' });
  }
});

// PUT Update Profile
router.put('/', authenticate, requireRole(['learner']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const {
      fullName,
      highestEducation,
      qualifications,
      currentRoleOrCourse,
      yearsOfExperience,
      organisationOrInstitution,
      skills,
      interests,
      previousTrainings,
      careerGoal,
      targetDomainScores,
    } = req.body;

    // Calculate completeness
    let score = 0;
    if (fullName) score += 10;
    if (highestEducation) score += 10;
    if (qualifications) score += 10;
    if (currentRoleOrCourse) score += 10;
    if (organisationOrInstitution) score += 10;
    if (skills && skills.length > 0) score += 15;
    if (interests && interests.length > 0) score += 10;
    if (previousTrainings && previousTrainings.length > 0) score += 10;
    if (careerGoal && careerGoal.trim().length > 10) score += 15;
    const completeness = Math.min(100, score);

    const updated = await prisma.learnerProfile.upsert({
      where: { userId },
      update: {
        fullName: fullName || '',
        highestEducation: highestEducation || '',
        qualifications: qualifications || '',
        currentRoleOrCourse: currentRoleOrCourse || '',
        yearsOfExperience: typeof yearsOfExperience === 'number' ? yearsOfExperience : 0,
        organisationOrInstitution: organisationOrInstitution || '',
        skills: JSON.stringify(skills || []),
        interests: JSON.stringify(interests || []),
        previousTrainings: JSON.stringify(previousTrainings || []),
        careerGoal: careerGoal || '',
        targetDomainScores: JSON.stringify(targetDomainScores || { Technical: 70, Statistical: 70, Digital: 70, Behavioural: 70 }),
        completeness,
      },
      create: {
        userId,
        fullName: fullName || req.user!.name,
        profileType: req.user!.role,
        highestEducation: highestEducation || '',
        qualifications: qualifications || '',
        currentRoleOrCourse: currentRoleOrCourse || '',
        yearsOfExperience: typeof yearsOfExperience === 'number' ? yearsOfExperience : 0,
        organisationOrInstitution: organisationOrInstitution || '',
        skills: JSON.stringify(skills || []),
        interests: JSON.stringify(interests || []),
        previousTrainings: JSON.stringify(previousTrainings || []),
        careerGoal: careerGoal || '',
        targetDomainScores: JSON.stringify(targetDomainScores || { Technical: 70, Statistical: 70, Digital: 70, Behavioural: 70 }),
        completeness,
      },
    });

    res.json({
      success: true,
      profile: {
        ...updated,
        skills: JSON.parse(updated.skills),
        interests: JSON.parse(updated.interests),
        previousTrainings: JSON.parse(updated.previousTrainings),
        targetDomainScores: JSON.parse(updated.targetDomainScores),
      },
    });
  } catch (err: any) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// GET Latest Domain Scores
router.get('/scores', authenticate, requireRole(['learner', 'admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const domains = ['Technical', 'Statistical', 'Digital', 'Behavioural'] as const;
    const scores: Record<string, number> = {
      Technical: 0,
      Statistical: 0,
      Digital: 0,
      Behavioural: 0,
    };

    for (const d of domains) {
      const latestAttempt = await prisma.assessmentAttempt.findFirst({
        where: { userId, domain: d, completed: true },
        orderBy: { date: 'desc' },
      });
      if (latestAttempt) {
        scores[d] = latestAttempt.score;
      }
    }

    res.json({ success: true, scores });
  } catch (err: any) {
    console.error('Fetch scores error:', err);
    res.status(500).json({ error: 'Failed to fetch domain scores.' });
  }
});

export default router;
