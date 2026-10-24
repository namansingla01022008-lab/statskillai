import { Router, Response } from 'express';
import { prisma } from '../db';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { generateSeedOrgEmployees } from '../../src/services/seedData';

const router = Router();

// GET Workforce Analytics Data (Admin only)
router.get('/workforce', authenticate, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    // 1. Fetch real registered users with profiles and completed attempts
    const registeredUsers = await prisma.user.findMany({
      where: { role: 'learner' },
      include: {
        profile: true,
        attempts: {
          where: { completed: true },
          orderBy: { date: 'desc' },
        },
      },
    });

    // Compute scores for registered users
    const registeredEmployees = registeredUsers.map((u) => {
      const scores: Record<string, number> = {
        Technical: 0,
        Statistical: 0,
        Digital: 0,
        Behavioural: 0,
      };

      ['Technical', 'Statistical', 'Digital', 'Behavioural'].forEach((d) => {
        const match = u.attempts.find((a) => a.domain === d);
        if (match) scores[d] = match.score;
        else scores[d] = 60; // Baseline
      });

      const criticalGapsCount = Object.values(scores).filter((s) => s < 70).length;

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        department: u.department || 'General Administration',
        designation: u.designation || 'Learner',
        profileType: u.profileType || 'Student',
        scores,
        participationStatus: u.attempts.length > 0 ? 'Active' : 'Pending',
        trainingStatus: (u.attempts.length >= 4 ? 'Completed' : u.attempts.length > 0 ? 'In progress' : 'Not started') as any,
        criticalGapsCount,
        lastAssessmentDate: u.attempts[0]?.date ? new Date(u.attempts[0].date).toISOString().split('T')[0] : '2026-10-01',
      };
    });

    // 2. Augment with seeded institutional employees so heatmap is comprehensive
    const seedEmployees = generateSeedOrgEmployees();

    // Combined roster: real users first, then seeded
    const allEmployees = [...registeredEmployees, ...seedEmployees];

    // Compute aggregate KPIs
    const totalEmployees = allEmployees.length;
    const activeCount = allEmployees.filter((e) => e.participationStatus === 'Active').length;
    const participationRate = totalEmployees > 0 ? Math.round((activeCount / totalEmployees) * 100) : 0;

    const completedCount = allEmployees.filter((e) => e.trainingStatus === 'Completed').length;
    const completionRate = totalEmployees > 0 ? Math.round((completedCount / totalEmployees) * 100) : 0;

    const totalScoresSum = allEmployees.reduce((acc, emp) => {
      const sum = emp.scores.Technical + emp.scores.Statistical + emp.scores.Digital + emp.scores.Behavioural;
      return acc + Math.round(sum / 4);
    }, 0);
    const workforceAverageScore = totalEmployees > 0 ? Math.round(totalScoresSum / totalEmployees) : 0;

    const totalCriticalGaps = allEmployees.reduce((acc, emp) => acc + emp.criticalGapsCount, 0);

    res.json({
      success: true,
      employees: allEmployees,
      kpis: {
        totalEmployees,
        participationRate,
        completionRate,
        workforceAverageScore,
        totalCriticalGaps,
      },
    });
  } catch (err: any) {
    console.error('Workforce analytics error:', err);
    res.status(500).json({ error: 'Failed to aggregate workforce analytics.' });
  }
});

export default router;
