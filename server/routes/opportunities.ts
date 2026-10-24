import { Router, Response } from 'express';
import { prisma } from '../db';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { notifyUser } from '../socket';

const router = Router();

// GET all opportunities
router.get('/', async (req, res) => {
  try {
    const opps = await prisma.opportunity.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const parsed = opps.map((o) => ({
      ...o,
      requiredSkills: JSON.parse(o.requiredSkills || '[]'),
      minDomainLevels: JSON.parse(o.minDomainLevels || '{}'),
    }));

    res.json({ success: true, opportunities: parsed });
  } catch (err: any) {
    console.error('Fetch opportunities error:', err);
    res.status(500).json({ error: 'Failed to fetch opportunities.' });
  }
});

// POST create opportunity (Admin only)
router.post('/', authenticate, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, organisation, orgId, sector, location, type, requiredSkills, minDomainLevels, description, deadline, stipendOrSalary } = req.body;

    if (!title || !organisation) {
      return res.status(400).json({ error: 'Title and organisation are required.' });
    }

    const opp = await prisma.opportunity.create({
      data: {
        title,
        organisation,
        orgId: orgId || 'org-custom',
        sector: sector || 'Public Sector',
        location: location || 'New Delhi / Remote',
        type: type || 'Job',
        requiredSkills: JSON.stringify(requiredSkills || []),
        minDomainLevels: JSON.stringify(minDomainLevels || { Technical: 60, Statistical: 60, Digital: 60, Behavioural: 60 }),
        description: description || '',
        deadline: deadline || '2026-12-31',
        stipendOrSalary: stipendOrSalary || 'Competitive',
      },
    });

    res.status(201).json({
      success: true,
      opportunity: {
        ...opp,
        requiredSkills: JSON.parse(opp.requiredSkills),
        minDomainLevels: JSON.parse(opp.minDomainLevels),
      },
    });
  } catch (err: any) {
    console.error('Create opportunity error:', err);
    res.status(500).json({ error: 'Failed to create opportunity.' });
  }
});

// DELETE opportunity (Admin only)
router.delete('/:id', authenticate, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.opportunity.delete({ where: { id } });
    res.json({ success: true, message: 'Opportunity deleted.' });
  } catch (err: any) {
    console.error('Delete opportunity error:', err);
    res.status(500).json({ error: 'Failed to delete opportunity.' });
  }
});

// POST Apply for opportunity (Learners)
router.post('/:id/apply', authenticate, requireRole(['learner']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id: opportunityId } = req.params;
    const userId = req.user!.userId;
    const { matchPercentage, notes } = req.body;

    const opp = await prisma.opportunity.findUnique({ where: { id: opportunityId } });
    if (!opp) {
      return res.status(404).json({ error: 'Opportunity not found.' });
    }

    const existing = await prisma.application.findFirst({
      where: { opportunityId, userId },
    });
    if (existing) {
      return res.status(400).json({ error: 'You have already applied for this opening.' });
    }

    const application = await prisma.application.create({
      data: {
        opportunityId,
        opportunityTitle: opp.title,
        organisation: opp.organisation,
        userId,
        userName: req.user!.name,
        userEmail: req.user!.email,
        status: 'Submitted',
        matchPercentage: typeof matchPercentage === 'number' ? matchPercentage : 75,
        notes: notes || 'Submitted via StatSkillAI Competency Gateway.',
      },
    });

    res.status(201).json({ success: true, application });
  } catch (err: any) {
    console.error('Apply error:', err);
    res.status(500).json({ error: 'Application submission failed.' });
  }
});

// GET current user's applications
router.get('/my-applications', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const applications = await prisma.application.findMany({
      where: { userId },
      orderBy: { appliedAt: 'desc' },
    });
    res.json({ success: true, applications });
  } catch (err: any) {
    console.error('Fetch my applications error:', err);
    res.status(500).json({ error: 'Failed to fetch applications.' });
  }
});

// GET all applications (Admin only)
router.get('/admin/all-applications', authenticate, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const applications = await prisma.application.findMany({
      orderBy: { appliedAt: 'desc' },
    });
    res.json({ success: true, applications });
  } catch (err: any) {
    console.error('Admin applications fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch all applications.' });
  }
});

// PATCH update application status (Admin only) -> Notifies user via Socket.io!
router.patch('/admin/applications/:id/status', authenticate, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Submitted', 'Under review', 'Shortlisted', 'Closed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid application status.' });
    }

    const app = await prisma.application.update({
      where: { id },
      data: { status },
    });

    // Real-time notification dispatch via Socket.io
    notifyUser(app.userId, {
      type: 'APPLICATION_STATUS_UPDATE',
      title: `Application Status Updated: ${status}`,
      message: `Your application for "${app.opportunityTitle}" at ${app.organisation} has been marked as "${status}".`,
      data: { applicationId: app.id, status },
    });

    res.json({ success: true, application: app });
  } catch (err: any) {
    console.error('Update application status error:', err);
    res.status(500).json({ error: 'Failed to update application status.' });
  }
});

export default router;
