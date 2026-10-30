import { Router, Response } from 'express';
import { prisma } from '../db';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET all careers (Defaults to status: 'verified')
router.get('/', async (req, res) => {
  try {
    const { status, pathway } = req.query;

    const where: any = {};
    if (status && typeof status === 'string') {
      where.status = status;
    } else {
      where.status = 'verified'; // Strictly verified careers by default
    }

    if (pathway && typeof pathway === 'string') {
      where.pathway = pathway;
    }

    const careers = await prisma.career.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const parsed = careers.map((c) => ({
      ...c,
      requiredSkills: JSON.parse(c.requiredSkills || '[]'),
    }));

    res.json({ success: true, careers: parsed });
  } catch (err: any) {
    console.error('Fetch careers error:', err);
    res.status(500).json({ error: 'Failed to fetch careers.' });
  }
});

// GET all datasets
router.get('/datasets', async (req, res) => {
  try {
    const datasets = await prisma.dataset.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, datasets });
  } catch (err: any) {
    console.error('Fetch datasets error:', err);
    res.status(500).json({ error: 'Failed to fetch datasets.' });
  }
});

export default router;
