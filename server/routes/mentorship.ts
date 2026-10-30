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

// POST Book a Live Mentorship Session
router.post('/book-session', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.user!.userId;
    const {
      mentorId,
      mentorName,
      mentorTitle,
      skillDomain,
      topic,
      date,
      timeSlot,
      price = 10,
    } = req.body;

    if (!mentorId || !topic || !date || !timeSlot) {
      return res.status(400).json({ error: 'mentorId, topic, date, and timeSlot are required.' });
    }

    const sessionId = `session-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const meetingId = `LIVE-${skillDomain?.toUpperCase().slice(0, 4) || 'SKILL'}-${Math.floor(1000 + Math.random() * 9000)}`;

    const booking = await prisma.mentorshipSessionBooking.create({
      data: {
        sessionId,
        meetingId,
        studentId,
        studentName: req.user!.name,
        mentorId,
        mentorName: mentorName || 'Verified Mentor',
        mentorTitle: mentorTitle || 'Mentor Specialist',
        skillDomain: skillDomain || 'Technical',
        topic,
        date,
        timeSlot,
        durationMinutes: 5,
        price: Number(price) || 10,
        paymentStatus: 'Successful',
        sessionStatus: 'Upcoming',
      },
    });

    // Real-time notification to student
    notifyUser(studentId, {
      type: 'SESSION_BOOKED',
      title: 'Mentorship Session Booked!',
      message: `Your live session on "${topic}" with ${mentorName} is confirmed for ${date} at ${timeSlot}. Meeting ID: ${meetingId}`,
      data: { sessionId, meetingId },
    });

    // Real-time notification to mentor
    const mentor = await prisma.mentor.findUnique({ where: { id: mentorId } });
    if (mentor) {
      notifyUser(mentor.userId, {
        type: 'NEW_SESSION_BOOKING',
        title: 'New Live Session Booked',
        message: `${req.user!.name} booked a session on "${topic}" for ${date} at ${timeSlot}.`,
        data: { sessionId, meetingId },
      });
    }

    res.status(201).json({ success: true, booking });
  } catch (err: any) {
    console.error('Book session error:', err);
    res.status(500).json({ error: 'Failed to book live mentorship session.' });
  }
});

// GET Session Details by sessionId or id
router.get('/sessions/:sessionId', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const booking = await prisma.mentorshipSessionBooking.findFirst({
      where: {
        OR: [{ sessionId }, { id: sessionId }, { meetingId: sessionId }],
      },
      include: {
        feedback: true,
      },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Session booking not found.' });
    }

    res.json({ success: true, booking });
  } catch (err: any) {
    console.error('Fetch session error:', err);
    res.status(500).json({ error: 'Failed to fetch session details.' });
  }
});

// POST Complete Live Session and Submit Mentor Feedback & Skill Boost
router.post('/sessions/:sessionId/complete', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const {
      studentUnderstanding,
      strengths = [],
      weaknesses = [],
      recommendedTopics = [],
      nextTasks = [],
      personalMessage = '',
    } = req.body;

    const booking = await prisma.mentorshipSessionBooking.findFirst({
      where: {
        OR: [{ sessionId }, { id: sessionId }, { meetingId: sessionId }],
      },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Session booking not found.' });
    }

    // Update booking status
    const updatedBooking = await prisma.mentorshipSessionBooking.update({
      where: { id: booking.id },
      data: {
        sessionStatus: 'Completed',
        completedAt: new Date(),
      },
    });

    // Calculate logical skill bump (+5 points)
    const domain = booking.skillDomain || 'Technical';
    const lastAttempt = await prisma.assessmentAttempt.findFirst({
      where: { userId: booking.studentId, domain },
      orderBy: { date: 'desc' },
    });
    const prevScore = lastAttempt ? lastAttempt.score : 62;
    const updatedScore = Math.min(98, prevScore + 5);

    // Record updated attempt reflecting mentorship mastery
    await prisma.assessmentAttempt.create({
      data: {
        userId: booking.studentId,
        domain,
        score: updatedScore,
        earnedWeight: Math.round(updatedScore * 0.3),
        maxWeight: 30,
        previousScore: prevScore,
        questions: '[]',
        userAnswers: '[]',
        completed: true,
      },
    });

    // Create feedback record
    const feedback = await prisma.mentorshipSessionFeedback.create({
      data: {
        bookingId: booking.id,
        sessionId: booking.sessionId,
        mentorId: booking.mentorId,
        studentId: booking.studentId,
        studentUnderstanding: studentUnderstanding || 'Good foundational comprehension with scope for advanced practice.',
        strengths: JSON.stringify(strengths),
        weaknesses: JSON.stringify(weaknesses),
        recommendedTopics: JSON.stringify(recommendedTopics),
        nextTasks: JSON.stringify(nextTasks),
        personalMessage,
        skillBoostPoints: 5,
        skillBoostDomain: domain,
        previousScore: prevScore,
        updatedScore,
      },
    });

    // Notify student
    notifyUser(booking.studentId, {
      type: 'SESSION_COMPLETED',
      title: 'Mentorship Session Completed ✓',
      message: `Your ${domain} competency progress has been updated (+5%). View your mentor feedback report!`,
      data: { sessionId: booking.sessionId, updatedScore },
    });

    res.json({
      success: true,
      booking: updatedBooking,
      feedback: {
        ...feedback,
        strengths: JSON.parse(feedback.strengths),
        weaknesses: JSON.parse(feedback.weaknesses),
        recommendedTopics: JSON.parse(feedback.recommendedTopics),
        nextTasks: JSON.parse(feedback.nextTasks),
      },
    });
  } catch (err: any) {
    console.error('Complete session error:', err);
    res.status(500).json({ error: 'Failed to complete session.' });
  }
});

// POST Submit Review & Rating for Session
router.post('/sessions/:sessionId/review', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { rating, review, isHelpful } = req.body;

    const feedback = await prisma.mentorshipSessionFeedback.findFirst({
      where: { sessionId },
    });

    if (feedback) {
      await prisma.mentorshipSessionFeedback.update({
        where: { id: feedback.id },
        data: {
          rating: Number(rating) || 5,
          review: review || '',
          isHelpful: Boolean(isHelpful),
        },
      });
    }

    res.json({ success: true, message: 'Review recorded successfully.' });
  } catch (err: any) {
    console.error('Submit review error:', err);
    res.status(500).json({ error: 'Failed to record review.' });
  }
});

// GET My Sessions (Learner or Mentor)
router.get('/my-sessions', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const role = req.user!.role;

    let bookings;
    if (role === 'mentor') {
      const mentor = await prisma.mentor.findUnique({ where: { userId } });
      const mentorId = mentor ? mentor.id : userId;
      bookings = await prisma.mentorshipSessionBooking.findMany({
        where: { OR: [{ mentorId }, { mentorName: req.user!.name }] },
        include: { feedback: true },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      bookings = await prisma.mentorshipSessionBooking.findMany({
        where: { studentId: userId },
        include: { feedback: true },
        orderBy: { createdAt: 'desc' },
      });
    }

    res.json({ success: true, bookings });
  } catch (err: any) {
    console.error('Fetch my sessions error:', err);
    res.status(500).json({ error: 'Failed to fetch sessions.' });
  }
});

export default router;
