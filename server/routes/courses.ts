import { Router, Response } from 'express';
import { prisma } from '../db';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET courses (Filters to status: 'verified' by default for learner integrity)
router.get('/', async (req, res) => {
  try {
    const { status, domain, topic } = req.query;

    const where: any = {};

    // By default, only serve 'verified' courses to learners and general API consumers
    if (status && typeof status === 'string') {
      where.status = status;
    } else {
      where.status = 'verified';
    }

    if (domain && typeof domain === 'string') {
      where.domain = domain;
    }

    if (topic && typeof topic === 'string') {
      where.topic = topic;
    }

    const courses = await prisma.course.findMany({
      where,
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

// POST create course (Admin only with required sourceUrl & verification metadata)
router.post('/', authenticate, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      title,
      domain,
      provider,
      source,
      duration,
      level,
      description,
      portalUrl,
      sourceUrl,
      sourceName,
      topic,
      language,
      licenseNote,
      status,
      skillsCovered,
    } = req.body;

    if (!title || !sourceUrl) {
      return res.status(400).json({ error: 'Title and sourceUrl are required.' });
    }

    const course = await prisma.course.create({
      data: {
        title,
        domain: domain || 'Statistical',
        provider: provider || 'SWAYAM',
        source: source || provider || 'SWAYAM',
        duration: duration || '8 Weeks',
        level: level || 'Intermediate',
        description: description || '',
        topic: topic || 'General Statistics',
        language: language || 'English',
        sourceUrl,
        sourceName: sourceName || provider || 'Official Portal',
        portalUrl: portalUrl || sourceUrl,
        licenseNote: licenseNote || null,
        status: status || 'unverified',
        lastVerifiedAt: status === 'verified' ? new Date() : null,
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
