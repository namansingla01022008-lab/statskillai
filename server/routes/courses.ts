import { Router, Response } from 'express';
import { prisma } from '../db';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET all courses
router.get('/', async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const parsed = courses.map((c) => ({
      ...c,
      skillsCovered: JSON.parse(c.skillsCovered || '[]'),
    }));

    res.json({ success: true, courses: parsed });
  } catch (err: any) {
    console.error('Fetch courses error:', err);
    res.status(500).json({ error: 'Failed to fetch courses.' });
  }
});

// POST create course (Admin only)
router.post('/', authenticate, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, domain, provider, source, duration, level, description, portalUrl, skillsCovered } = req.body;

    if (!title || !domain) {
      return res.status(400).json({ error: 'Title and domain are required.' });
    }

    const course = await prisma.course.create({
      data: {
        title,
        domain,
        provider: provider || 'National Portal',
        source: source || 'SWAYAM',
        duration: duration || '6 Weeks',
        level: level || 'Intermediate',
        description: description || '',
        portalUrl: portalUrl || 'https://swayam.gov.in',
        skillsCovered: JSON.stringify(skillsCovered || []),
      },
    });

    res.status(201).json({
      success: true,
      course: {
        ...course,
        skillsCovered: JSON.parse(course.skillsCovered),
      },
    });
  } catch (err: any) {
    console.error('Create course error:', err);
    res.status(500).json({ error: 'Failed to create course.' });
  }
});

// DELETE course (Admin only)
router.delete('/:id', authenticate, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.course.delete({ where: { id } });
    res.json({ success: true, message: 'Course deleted.' });
  } catch (err: any) {
    console.error('Delete course error:', err);
    res.status(500).json({ error: 'Failed to delete course.' });
  }
});

export default router;
