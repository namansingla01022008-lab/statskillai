import { Router, Response } from 'express';
import { prisma } from '../db';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { awardXP, manualAdjustXP } from '../services/rewardEngine';
import { sendUserNotification } from '../socket';

const router = Router();

// Apply admin authentication to all routes in this module
router.use(authenticate);
router.use(requireRole(['admin']));

// --- 1. REWARD CATALOGUE MANAGEMENT ---

// GET /api/admin/rewards - All rewards (active and inactive)
router.get('/rewards', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const rewards = await prisma.reward.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { redemptions: true } },
      },
    });

    res.json({ success: true, rewards });
  } catch (err: any) {
    console.error('Admin fetch rewards error:', err);
    res.status(500).json({ error: 'Failed to fetch reward catalogue.' });
  }
});

// POST /api/admin/rewards - Create reward item
router.post('/rewards', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const adminId = req.user!.userId;
    const { name, brand, category, description, xpCost, stock, isActive, imageUrl, requiresReview } = req.body;

    if (!name || !brand || xpCost === undefined) {
      return res.status(400).json({ error: 'name, brand, and xpCost are required.' });
    }

    const reward = await prisma.reward.create({
      data: {
        name: String(name).trim(),
        brand: String(brand).trim(),
        category: category || 'VOUCHER',
        description: description || '',
        xpCost: Math.max(1, Number(xpCost)),
        stock: stock !== undefined ? Number(stock) : -1,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        imageUrl: imageUrl || null,
        requiresReview: Boolean(requiresReview),
      },
    });

    await prisma.rewardAuditLog.create({
      data: {
        actorId: adminId,
        actorRole: 'admin',
        action: 'REWARD_CREATE',
        detail: JSON.stringify({ rewardId: reward.id, name: reward.name, xpCost: reward.xpCost }),
      },
    });

    res.status(201).json({ success: true, reward });
  } catch (err: any) {
    console.error('Admin create reward error:', err);
    res.status(500).json({ error: 'Failed to create reward item.' });
  }
});

// PATCH /api/admin/rewards/:id - Update reward item
router.patch('/rewards/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = req.user!.userId;
    const data = req.body;

    const updated = await prisma.reward.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: String(data.name).trim() }),
        ...(data.brand !== undefined && { brand: String(data.brand).trim() }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.xpCost !== undefined && { xpCost: Math.max(1, Number(data.xpCost)) }),
        ...(data.stock !== undefined && { stock: Number(data.stock) }),
        ...(data.isActive !== undefined && { isActive: Boolean(data.isActive) }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
        ...(data.requiresReview !== undefined && { requiresReview: Boolean(data.requiresReview) }),
      },
    });

    await prisma.rewardAuditLog.create({
      data: {
        actorId: adminId,
        actorRole: 'admin',
        action: 'REWARD_UPDATE',
        detail: JSON.stringify({ rewardId: id, updates: data }),
      },
    });

    res.json({ success: true, reward: updated });
  } catch (err: any) {
    console.error('Admin update reward error:', err);
    res.status(500).json({ error: 'Failed to update reward item.' });
  }
});

// DELETE /api/admin/rewards/:id - Delete reward
router.delete('/rewards/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = req.user!.userId;

    await prisma.reward.delete({ where: { id } });

    await prisma.rewardAuditLog.create({
      data: {
        actorId: adminId,
        actorRole: 'admin',
        action: 'REWARD_DELETE',
        detail: JSON.stringify({ rewardId: id }),
      },
    });

    res.json({ success: true, message: 'Reward removed from catalogue.' });
  } catch (err: any) {
    console.error('Admin delete reward error:', err);
    res.status(500).json({ error: 'Failed to delete reward item.' });
  }
});

// --- 2. CERTIFICATE VERIFICATION QUEUE ---

// GET /api/admin/certificates - All certificates for review
router.get('/certificates', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const status = req.query.status as string | undefined;

    const certificates = await prisma.certificate.findMany({
      where: status ? { status } : undefined,
      orderBy: { submittedAt: 'desc' },
    });

    // Populate user names
    const userIds = certificates.map((c) => c.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true, department: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const enriched = certificates.map((c) => ({
      ...c,
      user: userMap.get(c.userId) || { name: 'Unknown', email: '', department: '' },
    }));

    res.json({ success: true, certificates: enriched });
  } catch (err: any) {
    console.error('Admin fetch certificates error:', err);
    res.status(500).json({ error: 'Failed to fetch certificates.' });
  }
});

// PATCH /api/admin/certificates/:id/approve - Approve certificate and award XP
router.patch('/certificates/:id/approve', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = req.user!.userId;
    const { note } = req.body;

    const cert = await prisma.certificate.findUnique({ where: { id } });
    if (!cert) {
      return res.status(404).json({ error: 'Certificate not found.' });
    }

    if (cert.status === 'APPROVED' && cert.xpAwarded) {
      return res.status(400).json({ error: 'Certificate has already been approved and XP was awarded.' });
    }

    // 1. Mark APPROVED in DB
    const updatedCert = await prisma.certificate.update({
      where: { id },
      data: {
        status: 'APPROVED',
        verifiedAt: new Date(),
        adminNote: note || 'Approved by administrator.',
        xpAwarded: true,
      },
    });

    // 2. Award XP via central idempotent engine
    const awardResult = await awardXP(cert.userId, 'CERT_APPROVED', cert.id, {
      description: `Verified Certificate: ${cert.courseName} (${cert.provider})`,
      idempotencyKey: `cert-xp:${cert.id}`,
    });

    // 3. Audit log
    await prisma.rewardAuditLog.create({
      data: {
        actorId: adminId,
        actorRole: 'admin',
        targetUserId: cert.userId,
        action: 'CERT_APPROVE',
        detail: JSON.stringify({
          certId: cert.id,
          provider: cert.provider,
          courseName: cert.courseName,
          xpAwarded: awardResult.xp,
        }),
      },
    });

    // 4. Real-time notification via Socket.io
    try {
      sendUserNotification(cert.userId, {
        type: 'CERTIFICATE_APPROVED',
        title: 'Certificate Verified! 🎉',
        message: `Your certificate for "${cert.courseName}" has been approved! +${awardResult.xp || 200} XP added to your balance.`,
      });
    } catch (sockErr) {
      console.warn('Socket notification failed:', sockErr);
    }

    res.json({
      success: true,
      certificate: updatedCert,
      xpResult: awardResult,
      message: 'Certificate successfully approved and XP awarded!',
    });
  } catch (err: any) {
    console.error('Approve certificate error:', err);
    res.status(500).json({ error: 'Failed to approve certificate.' });
  }
});

// PATCH /api/admin/certificates/:id/reject - Reject certificate
router.patch('/certificates/:id/reject', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = req.user!.userId;
    const { reason, note } = req.body;

    if (!reason || String(reason).trim().length < 5) {
      return res.status(400).json({
        error: 'A clear rejection reason of at least 5 characters is mandatory.',
      });
    }

    const cert = await prisma.certificate.findUnique({ where: { id } });
    if (!cert) {
      return res.status(404).json({ error: 'Certificate not found.' });
    }

    const updatedCert = await prisma.certificate.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason: String(reason).trim(),
        adminNote: note || null,
        verifiedAt: new Date(),
      },
    });

    await prisma.rewardAuditLog.create({
      data: {
        actorId: adminId,
        actorRole: 'admin',
        targetUserId: cert.userId,
        action: 'CERT_REJECT',
        detail: JSON.stringify({
          certId: cert.id,
          reason,
          courseName: cert.courseName,
        }),
      },
    });

    try {
      sendUserNotification(cert.userId, {
        type: 'CERTIFICATE_REJECTED',
        title: 'Certificate Verification Update',
        message: `Your certificate submission for "${cert.courseName}" could not be verified: ${reason}`,
      });
    } catch {}

    res.json({ success: true, certificate: updatedCert });
  } catch (err: any) {
    console.error('Reject certificate error:', err);
    res.status(500).json({ error: 'Failed to reject certificate.' });
  }
});

// --- 3. REWARD TRANSACTIONS LEDGER ---

// GET /api/admin/reward-transactions - Full ledger
router.get('/reward-transactions', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const limit = Math.min(100, Number(req.query.limit) || 25);
    const page = Math.max(1, Number(req.query.page) || 1);
    const skip = (page - 1) * limit;
    const userId = req.query.userId as string | undefined;
    const type = req.query.type as string | undefined;

    const where: any = {};
    if (userId) where.userId = userId;
    if (type) where.type = type;

    const [transactions, total] = await Promise.all([
      prisma.rewardTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      prisma.rewardTransaction.count({ where }),
    ]);

    // Attach user information
    const userIds = Array.from(new Set(transactions.map((t) => t.userId)));
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const enriched = transactions.map((t) => ({
      ...t,
      user: userMap.get(t.userId) || { name: 'Unknown', email: '' },
    }));

    res.json({
      success: true,
      transactions: enriched,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err: any) {
    console.error('Admin fetch transactions error:', err);
    res.status(500).json({ error: 'Failed to fetch transaction ledger.' });
  }
});

// --- 4. REDEMPTIONS MANAGEMENT ---

// GET /api/admin/redemptions - All user redemptions
router.get('/redemptions', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const redemptions = await prisma.redemption.findMany({
      include: {
        reward: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const userIds = Array.from(new Set(redemptions.map((r) => r.userId)));
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true, department: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    // Mask voucher codes in admin response for security compliance
    const enriched = redemptions.map((r) => {
      let maskedCode = null;
      if (r.voucherCode) {
        const parts = r.voucherCode.split('-');
        maskedCode = parts.length > 1
          ? `****-****-${parts[parts.length - 1]}`
          : '****-PROTECTED';
      }
      return {
        ...r,
        voucherCode: maskedCode,
        user: userMap.get(r.userId) || { name: 'Unknown', email: '', department: '' },
      };
    });

    res.json({ success: true, redemptions: enriched });
  } catch (err: any) {
    console.error('Admin fetch redemptions error:', err);
    res.status(500).json({ error: 'Failed to fetch redemptions.' });
  }
});

// POST /api/admin/redemptions/:id/refund - Manual refund for failed redemption
router.post('/redemptions/:id/refund', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = req.user!.userId;
    const { reason } = req.body;

    const redemption = await prisma.redemption.findUnique({
      where: { id },
      include: { reward: true },
    });

    if (!redemption) {
      return res.status(404).json({ error: 'Redemption record not found.' });
    }

    if (redemption.status === 'REFUNDED') {
      return res.status(400).json({ error: 'This redemption has already been refunded.' });
    }

    const refundTxKey = `admin-refund:${redemption.id}:${Date.now()}`;
    const [refundTx] = await prisma.$transaction([
      prisma.rewardTransaction.create({
        data: {
          userId: redemption.userId,
          type: 'REFUND',
          xpAmount: redemption.xpSpent,
          eventType: 'ADMIN_MANUAL_REFUND',
          referenceId: redemption.id,
          idempotencyKey: refundTxKey,
          description: `Admin Refund: ${reason || 'Manual refund by admin'}`,
          processedVia: 'DIRECT',
        },
      }),
      prisma.rewardBalance.update({
        where: { userId: redemption.userId },
        data: {
          balance: { increment: redemption.xpSpent },
          totalRedeemed: { decrement: redemption.xpSpent },
        },
      }),
      prisma.redemption.update({
        where: { id },
        data: {
          status: 'REFUNDED',
          failureReason: reason || 'Manual refund issued by admin.',
          refundTxId: refundTxKey,
        },
      }),
      prisma.rewardAuditLog.create({
        data: {
          actorId: adminId,
          actorRole: 'admin',
          targetUserId: redemption.userId,
          action: 'MANUAL_REFUND',
          detail: JSON.stringify({
            redemptionId: id,
            xpRefunded: redemption.xpSpent,
            reason,
          }),
        },
      }),
    ]);

    try {
      sendUserNotification(redemption.userId, {
        type: 'REWARD_REFUNDED',
        title: 'XP Refund Processed',
        message: `${redemption.xpSpent} XP has been refunded to your reward balance. Reason: ${reason || 'Administrative adjustment'}`,
      });
    } catch {}

    res.json({
      success: true,
      message: `Successfully refunded ${redemption.xpSpent} XP to the learner.`,
      transactionId: refundTx.id,
    });
  } catch (err: any) {
    console.error('Manual refund error:', err);
    res.status(500).json({ error: 'Failed to process refund.' });
  }
});

// --- 5. MANUAL XP ADJUSTMENTS ---

// POST /api/admin/rewards/adjust - Manually award or deduct XP with mandatory reason
router.post('/rewards/adjust', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const adminId = req.user!.userId;
    const { targetUserId, amount, reason } = req.body;

    if (!targetUserId || amount === undefined || !reason) {
      return res.status(400).json({
        error: 'targetUserId, amount (positive or negative number), and reason are required.',
      });
    }

    const result = await manualAdjustXP(
      adminId,
      'admin',
      String(targetUserId),
      Number(amount),
      String(reason)
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    try {
      const isPositive = Number(amount) > 0;
      sendUserNotification(String(targetUserId), {
        type: 'XP_ADJUSTED',
        title: isPositive ? 'Bonus XP Awarded! ⭐' : 'XP Balance Adjustment',
        message: `${isPositive ? '+' : ''}${amount} XP adjusted on your account. Reason: ${reason}`,
      });
    } catch {}

    res.json({
      success: true,
      newBalance: result.newBalance,
      message: `Successfully adjusted ${amount} XP. New balance: ${result.newBalance}`,
    });
  } catch (err: any) {
    console.error('Manual XP adjustment error:', err);
    res.status(500).json({ error: 'Failed to adjust XP.' });
  }
});

// --- 6. REWARD RULES CONFIGURATION ---

// GET /api/admin/reward-rules - View all earning rules
router.get('/reward-rules', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const rules = await prisma.rewardRule.findMany({
      orderBy: { eventType: 'asc' },
    });
    res.json({ success: true, rules });
  } catch (err: any) {
    console.error('Fetch reward rules error:', err);
    res.status(500).json({ error: 'Failed to fetch reward rules.' });
  }
});

// PATCH /api/admin/reward-rules/:id - Update rule (toggle active, change XP amount, daily cap)
router.patch('/reward-rules/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = req.user!.userId;
    const { xpAmount, isActive, dailyCap, description } = req.body;

    const updated = await prisma.rewardRule.update({
      where: { id },
      data: {
        ...(xpAmount !== undefined && { xpAmount: Number(xpAmount) }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
        ...(dailyCap !== undefined && { dailyCap: dailyCap === null ? null : Number(dailyCap) }),
        ...(description !== undefined && { description: String(description) }),
      },
    });

    await prisma.rewardAuditLog.create({
      data: {
        actorId: adminId,
        actorRole: 'admin',
        action: 'RULE_UPDATE',
        detail: JSON.stringify({ ruleId: id, eventType: updated.eventType, updates: req.body }),
      },
    });

    res.json({ success: true, rule: updated });
  } catch (err: any) {
    console.error('Update reward rule error:', err);
    res.status(500).json({ error: 'Failed to update reward rule.' });
  }
});

// --- 7. AUDIT LOG ---

// GET /api/admin/audit-log - View immutable admin audit trail
router.get('/audit-log', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const limit = Math.min(100, Number(req.query.limit) || 30);
    const logs = await prisma.rewardAuditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    res.json({ success: true, logs });
  } catch (err: any) {
    console.error('Fetch audit log error:', err);
    res.status(500).json({ error: 'Failed to fetch audit logs.' });
  }
});

export default router;
