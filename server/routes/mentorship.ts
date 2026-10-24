import { Router, Response } from 'express';
import { prisma } from '../db';
import { authenticate, requireRole, AuthenticatedRequest, requireOwnership } from '../middleware/auth';
import { emitDirectMessage, notifyUser } from '../socket';

const router = Router();

// GET Mentors Directory
router.get('/mentors', async (req, res) => {
  try {
    const mentors = await prisma.mentor.findMany({
      orderBy: { rating: 'desc' },
    });

    const parsed = mentors.map((m) => ({
      ...m,
      languages: JSON.parse(m.languages || '[]'),
    }));

    res.json({ success: true, mentors: parsed });
  } catch (err: any) {
    console.error('Fetch mentors error:', err);
    res.status(500).json({ error: 'Failed to fetch mentors.' });
  }
});

// PATCH toggle mentor verification (Admin only)
router.patch('/mentors/:id/verify', authenticate, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const mentor = await prisma.mentor.findUnique({ where: { id } });
    if (!mentor) {
      return res.status(404).json({ error: 'Mentor not found.' });
    }

    const updated = await prisma.mentor.update({
      where: { id },
      data: {
        isVerified: !mentor.isVerified,
        verifiedDate: !mentor.isVerified ? new Date().toISOString().split('T')[0] : null,
      },
    });

    res.json({
      success: true,
      mentor: {
        ...updated,
        languages: JSON.parse(updated.languages || '[]'),
      },
    });
  } catch (err: any) {
    console.error('Verify mentor error:', err);
    res.status(500).json({ error: 'Failed to update verification status.' });
  }
});

// GET current learner's mentorships
router.get('/my-mentorships', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const learnerId = req.user!.userId;
    const mentorships = await prisma.mentorship.findMany({
      where: { learnerId },
      include: {
        mentor: true,
      },
      orderBy: { requestedAt: 'desc' },
    });

    const parsed = mentorships.map((m) => ({
      ...m,
      feedbackNotes: JSON.parse(m.feedbackNotes || '[]'),
    }));

    res.json({ success: true, mentorships: parsed });
  } catch (err: any) {
    console.error('Fetch my mentorships error:', err);
    res.status(500).json({ error: 'Failed to fetch mentorships.' });
  }
});

// GET mentor's assigned mentees
router.get('/assigned-mentees', authenticate, requireRole(['mentor', 'admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const mentorUserId = req.user!.userId;
    const mentorships = await prisma.mentorship.findMany({
      where: { mentorUserId },
      orderBy: { requestedAt: 'desc' },
    });

    const parsed = mentorships.map((m) => ({
      ...m,
      feedbackNotes: JSON.parse(m.feedbackNotes || '[]'),
    }));

    res.json({ success: true, mentorships: parsed });
  } catch (err: any) {
    console.error('Fetch assigned mentees error:', err);
    res.status(500).json({ error: 'Failed to fetch assigned mentees.' });
  }
});

// POST request mentorship
router.post('/request', authenticate, requireRole(['learner']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const learnerId = req.user!.userId;
    const { mentorId, goalMessage } = req.body;

    if (!mentorId || !goalMessage) {
      return res.status(400).json({ error: 'mentorId and goalMessage are required.' });
    }

    const mentor = await prisma.mentor.findUnique({ where: { id: mentorId } });
    if (!mentor) {
      return res.status(404).json({ error: 'Mentor not found.' });
    }

    const mentorship = await prisma.mentorship.create({
      data: {
        mentorId: mentor.id,
        mentorName: mentor.name,
        mentorUserId: mentor.userId,
        learnerId,
        learnerName: req.user!.name,
        learnerProfileType: req.user!.role,
        goalMessage: goalMessage.trim(),
        status: 'Pending',
        meetingSchedule: 'Awaiting mentor schedule proposal',
        feedbackNotes: '[]',
      },
    });

    // Notify mentor via Socket.io
    notifyUser(mentor.userId, {
      type: 'NEW_MENTEE_REQUEST',
      title: 'New Mentorship Request',
      message: `${req.user!.name} has requested your mentorship guidance.`,
      data: { mentorshipId: mentorship.id },
    });

    res.status(201).json({
      success: true,
      mentorship: {
        ...mentorship,
        feedbackNotes: [],
      },
    });
  } catch (err: any) {
    console.error('Request mentorship error:', err);
    res.status(500).json({ error: 'Mentorship request failed.' });
  }
});

// PATCH update mentorship status (Mentor only)
router.patch('/:id/status', authenticate, requireRole(['mentor', 'admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, meetingSchedule } = req.body;

    const mentorship = await prisma.mentorship.update({
      where: { id },
      data: {
        status,
        meetingSchedule: meetingSchedule !== undefined ? meetingSchedule : undefined,
      },
    });

    // Notify learner of acceptance/rejection
    notifyUser(mentorship.learnerId, {
      type: 'MENTORSHIP_STATUS_UPDATE',
      title: `Mentorship ${status}`,
      message: `${mentorship.mentorName} updated your mentorship status to "${status}".`,
      data: { mentorshipId: mentorship.id, status },
    });

    res.json({ success: true, mentorship });
  } catch (err: any) {
    console.error('Update mentorship status error:', err);
    res.status(500).json({ error: 'Failed to update mentorship status.' });
  }
});

// POST add feedback directive note (Mentor only)
router.post('/:id/directive', authenticate, requireRole(['mentor', 'admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    if (!note || !note.trim()) {
      return res.status(400).json({ error: 'Directive note text is required.' });
    }

    const mentorship = await prisma.mentorship.findUnique({ where: { id } });
    if (!mentorship) {
      return res.status(404).json({ error: 'Mentorship not found.' });
    }

    const currentNotes = JSON.parse(mentorship.feedbackNotes || '[]');
    currentNotes.push(note.trim());

    const updated = await prisma.mentorship.update({
      where: { id },
      data: { feedbackNotes: JSON.stringify(currentNotes) },
    });

    notifyUser(mentorship.learnerId, {
      type: 'NEW_MENTOR_DIRECTIVE',
      title: 'New Mentor Directive',
      message: `${mentorship.mentorName} has added a new feedback directive to your profile.`,
      data: { note: note.trim() },
    });

    res.json({ success: true, mentorship: { ...updated, feedbackNotes: currentNotes } });
  } catch (err: any) {
    console.error('Add directive error:', err);
    res.status(500).json({ error: 'Failed to add directive.' });
  }
});

// GET direct messages for a mentorship thread (row-level: only participants can read)
router.get('/:id/messages', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id: mentorshipId } = req.params;
    const userId = req.user!.userId;

    // Verify the requesting user is a participant in this mentorship
    const mentorship = await prisma.mentorship.findUnique({ where: { id: mentorshipId } });
    if (!mentorship) {
      return res.status(404).json({ error: 'Mentorship not found.' });
    }

    if (mentorship.learnerId !== userId && mentorship.mentorUserId !== userId && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'You are not authorized to view these messages.' });
    }

    const messages = await prisma.directMessage.findMany({
      where: { mentorshipId },
      orderBy: { timestamp: 'asc' },
    });

    // Mark messages as read for this user
    await prisma.directMessage.updateMany({
      where: {
        mentorshipId,
        senderId: { not: userId },
        isRead: false,
      },
      data: { isRead: true },
    });

    res.json({ success: true, messages });
  } catch (err: any) {
    console.error('Fetch messages error:', err);
    res.status(500).json({ error: 'Failed to fetch messages.' });
  }
});

// POST send direct message (row-level: only participants can send, real-time via Socket.io!)
router.post('/:id/messages', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id: mentorshipId } = req.params;
    const { text } = req.body;
    const userId = req.user!.userId;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Message text cannot be empty.' });
    }

    const mentorship = await prisma.mentorship.findUnique({ where: { id: mentorshipId } });
    if (!mentorship) {
      return res.status(404).json({ error: 'Mentorship not found.' });
    }

    // Row-level security: only participants can send messages
    if (mentorship.learnerId !== userId && mentorship.mentorUserId !== userId && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'You are not authorized to send messages in this mentorship.' });
    }

    const msg = await prisma.directMessage.create({
      data: {
        mentorshipId,
        senderId: req.user!.userId,
        senderName: req.user!.name,
        senderRole: req.user!.role,
        text: text.trim(),
      },
    });

    // Broadcast in real-time via Socket.io
    emitDirectMessage(mentorshipId, msg);

    // Notify the other party if offline
    const recipientId = req.user!.userId === mentorship.learnerId ? mentorship.mentorUserId : mentorship.learnerId;
    notifyUser(recipientId, {
      type: 'NEW_DIRECT_MESSAGE',
      title: `Message from ${req.user!.name}`,
      message: text.trim().slice(0, 80),
      data: { mentorshipId, messageId: msg.id },
    });

    res.status(201).json({ success: true, message: msg });
  } catch (err: any) {
    console.error('Send message error:', err);
    res.status(500).json({ error: 'Failed to send direct message.' });
  }
});

export default router;
