import { prisma } from '../db';
import { evaluateBadges } from './badgeEngine';
import { voucherProvider } from './voucherAdapter';

export interface AwardOptions {
  amount?: number;
  idempotencyKey?: string;
  description?: string;
  skipBadgeEvaluation?: boolean;
}

export interface AwardResult {
  awarded: boolean;
  xp: number;
  reason?: string;
  transactionId?: string;
  newBalance?: number;
}

// Default event reward values if rule table is not yet seeded
const DEFAULT_EVENT_XP: Record<string, number> = {
  ASSESSMENT_PASS: 10,
  QUIZ_PASS: 10,
  STEP_COMPLETE: 10,
  COURSE_COMPLETE: 100,
  PATH_COMPLETE: 150,
  CERT_APPROVED: 200,
  STREAK_7DAY: 50,
  BADGE_BONUS: 25,
};

/**
 * Award XP to a learner idempotently and atomically.
 */
export async function awardXP(
  userId: string,
  eventType: string,
  referenceId: string,
  options: AwardOptions = {}
): Promise<AwardResult> {
  // 1. Determine XP amount and rule status
  let xpAmount = options.amount;
  let ruleLabel = eventType;

  if (xpAmount === undefined) {
    try {
      const rule = await prisma.rewardRule.findUnique({
        where: { eventType },
      });

      if (rule) {
        if (!rule.isActive) {
          return { awarded: false, xp: 0, reason: 'RULE_INACTIVE' };
        }
        xpAmount = rule.xpAmount;
        ruleLabel = rule.label;

        // Daily cap enforcement if configured
        if (rule.dailyCap && rule.dailyCap > 0) {
          const todayStart = new Date();
          todayStart.setUTCHours(0, 0, 0, 0);

          const dailyTotal = await prisma.rewardTransaction.aggregate({
            where: {
              userId,
              eventType,
              type: 'EARN',
              createdAt: { gte: todayStart },
            },
            _sum: { xpAmount: true },
          });

          const earnedToday = dailyTotal._sum.xpAmount || 0;
          if (earnedToday >= rule.dailyCap) {
            return { awarded: false, xp: 0, reason: 'DAILY_CAP_REACHED' };
          }
        }
      } else {
        xpAmount = DEFAULT_EVENT_XP[eventType] || 10;
      }
    } catch {
      xpAmount = DEFAULT_EVENT_XP[eventType] || 10;
    }
  }

  if (xpAmount <= 0) {
    return { awarded: false, xp: 0, reason: 'ZERO_OR_NEGATIVE_XP' };
  }

  // 2. Deterministic Idempotency Key
  const idempotencyKey =
    options.idempotencyKey || `${eventType.toLowerCase()}:${userId}:${referenceId}`;

  const description =
    options.description || `Earned ${xpAmount} XP for ${ruleLabel}`;

  try {
    // 3. Atomic Database Transaction: Transaction Ledger + Balance Upsert
    const [txRecord, updatedBalance] = await prisma.$transaction([
      prisma.rewardTransaction.create({
        data: {
          userId,
          type: 'EARN',
          xpAmount,
          eventType,
          referenceId,
          idempotencyKey,
          description,
          processedVia: 'DIRECT',
        },
      }),
      prisma.rewardBalance.upsert({
        where: { userId },
        create: {
          userId,
          totalEarned: xpAmount,
          balance: xpAmount,
          totalRedeemed: 0,
        },
        update: {
          totalEarned: { increment: xpAmount },
          balance: { increment: xpAmount },
        },
      }),
    ]);

    // 4. Evaluate badges asynchronously if not suppressed
    if (!options.skipBadgeEvaluation) {
      setTimeout(() => {
        evaluateBadges(userId, awardXP).catch((e) =>
          console.error('Asynchronous badge evaluation error:', e)
        );
      }, 50);
    }

    return {
      awarded: true,
      xp: xpAmount,
      transactionId: txRecord.id,
      newBalance: updatedBalance.balance,
    };
  } catch (err: any) {
    // P2002 is Prisma's unique constraint violation (duplicate idempotencyKey)
    if (err?.code === 'P2002') {
      return {
        awarded: false,
        xp: 0,
        reason: 'DUPLICATE_EVENT_ALREADY_AWARDED',
      };
    }

    console.error(`Reward award failed for ${userId} (${eventType}):`, err?.message || err);

    // Save to Outbox for reliable background recovery
    try {
      await prisma.rewardOutbox.create({
        data: {
          userId,
          eventType,
          referenceId,
          xpAmount,
          status: 'PENDING',
          lastError: err?.message || String(err),
        },
      });
    } catch (outboxErr) {
      console.error('Failed to create outbox recovery record:', outboxErr);
    }

    return {
      awarded: false,
      xp: 0,
      reason: 'TRANSACTION_ERROR_QUEUED_TO_OUTBOX',
    };
  }
}

/**
 * Atomic Redemption Workflow
 */
export async function redeemReward(
  userId: string,
  rewardId: string,
  clientKey?: string
): Promise<{
  success: boolean;
  redemption?: any;
  error?: string;
  refunded?: boolean;
}> {
  const idempotencyKey =
    clientKey || `redeem:${userId}:${rewardId}:${Date.now()}`;

  // 1. First transaction: check balance + check stock + debit XP + create pending redemption
  let pendingRedemption: any;
  let rewardData: any;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // A. Check balance
      const userBalance = await tx.rewardBalance.findUnique({ where: { userId } });
      const currentBalance = userBalance?.balance || 0;

      // B. Fetch reward
      const reward = await tx.reward.findUnique({ where: { id: rewardId } });
      if (!reward || !reward.isActive) {
        throw new Error('REWARD_NOT_AVAILABLE');
      }

      if (reward.stock === 0) {
        throw new Error('OUT_OF_STOCK');
      }

      if (currentBalance < reward.xpCost) {
        throw new Error(`INSUFFICIENT_XP: Required ${reward.xpCost}, available ${currentBalance}`);
      }

      // C. Debit balance
      await tx.rewardBalance.update({
        where: { userId },
        data: {
          balance: { decrement: reward.xpCost },
          totalRedeemed: { increment: reward.xpCost },
        },
      });

      // D. Decrement stock if finite
      if (reward.stock > 0) {
        await tx.reward.update({
          where: { id: rewardId },
          data: { stock: { decrement: 1 } },
        });
      }

      // E. Ledger record
      await tx.rewardTransaction.create({
        data: {
          userId,
          type: 'DEDUCT',
          xpAmount: reward.xpCost,
          eventType: 'REWARD_REDEMPTION',
          referenceId: reward.id,
          idempotencyKey: `deduct-${idempotencyKey}`,
          description: `Redeemed ${reward.name} for ${reward.xpCost} XP`,
          processedVia: 'DIRECT',
        },
      });

      // F. Create Redemption record
      const redemption = await tx.redemption.create({
        data: {
          userId,
          rewardId,
          xpSpent: reward.xpCost,
          status: 'PROCESSING',
          idempotencyKey,
        },
      });

      return { redemption, reward };
    });

    pendingRedemption = result.redemption;
    rewardData = result.reward;
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return { success: false, error: 'A redemption with this request key has already been processed.' };
    }
    return { success: false, error: err?.message || 'Failed to initiate redemption.' };
  }

  // 2. Dispatch to voucher delivery provider
  try {
    const voucherRes = await voucherProvider.orderVoucher({
      redemptionId: pendingRedemption.id,
      userId,
      rewardId: rewardData.id,
      brand: rewardData.brand,
      amount: rewardData.xpCost,
    });

    if (voucherRes.success && voucherRes.voucherCode) {
      // Mark SUCCESS
      const finalized = await prisma.redemption.update({
        where: { id: pendingRedemption.id },
        data: {
          status: 'SUCCESS',
          voucherCode: voucherRes.voucherCode,
          completedAt: new Date(),
        },
      });

      return { success: true, redemption: finalized };
    } else {
      throw new Error(voucherRes.error || 'Provider rejected voucher request.');
    }
  } catch (deliveryErr: any) {
    console.error('Voucher delivery failed, triggering automatic refund:', deliveryErr);

    // 3. Automatic atomic rollback & refund
    try {
      const refundTxKey = `refund:${pendingRedemption.id}`;
      const [refundTx] = await prisma.$transaction([
        prisma.rewardTransaction.create({
          data: {
            userId,
            type: 'REFUND',
            xpAmount: pendingRedemption.xpSpent,
            eventType: 'REWARD_REFUND',
            referenceId: pendingRedemption.id,
            idempotencyKey: refundTxKey,
            description: `Automated Refund: ${rewardData.name} delivery failed`,
            processedVia: 'DIRECT',
          },
        }),
        prisma.rewardBalance.update({
          where: { userId },
          data: {
            balance: { increment: pendingRedemption.xpSpent },
            totalRedeemed: { decrement: pendingRedemption.xpSpent },
          },
        }),
        // Restock if finite
        ...(rewardData.stock >= 0
          ? [
              prisma.reward.update({
                where: { id: rewardData.id },
                data: { stock: { increment: 1 } },
              }),
            ]
          : []),
      ]);

      const refundedRedemption = await prisma.redemption.update({
        where: { id: pendingRedemption.id },
        data: {
          status: 'REFUNDED',
          failureReason: deliveryErr?.message || 'Delivery error',
          refundTxId: refundTx.id,
        },
      });

      return {
        success: false,
        error: `Delivery failed: ${deliveryErr?.message}. Your ${pendingRedemption.xpSpent} XP has been automatically refunded to your balance.`,
        refunded: true,
        redemption: refundedRedemption,
      };
    } catch (refundErr: any) {
      console.error('CRITICAL: Automatic refund failed:', refundErr);
      await prisma.redemption.update({
        where: { id: pendingRedemption.id },
        data: {
          status: 'FAILED',
          failureReason: `Delivery and refund failure: ${deliveryErr?.message}; refundErr: ${refundErr?.message}`,
        },
      });

      return {
        success: false,
        error: 'Voucher delivery encountered an issue. Please contact support.',
      };
    }
  }
}

/**
 * Background outbox processor to retry failed awards safely
 */
export async function processOutbox(): Promise<{ processed: number; errors: number }> {
  let processed = 0;
  let errors = 0;

  try {
    const pendingEvents = await prisma.rewardOutbox.findMany({
      where: {
        status: 'PENDING',
        retryCount: { lt: 5 },
      },
      take: 20,
    });

    for (const item of pendingEvents) {
      try {
        const res = await awardXP(item.userId, item.eventType, item.referenceId, {
          amount: item.xpAmount,
        });

        if (res.awarded || res.reason === 'DUPLICATE_EVENT_ALREADY_AWARDED') {
          await prisma.rewardOutbox.update({
            where: { id: item.id },
            data: { status: 'DONE', processedAt: new Date() },
          });
          processed++;
        } else {
          await prisma.rewardOutbox.update({
            where: { id: item.id },
            data: {
              retryCount: { increment: 1 },
              lastError: res.reason,
            },
          });
          errors++;
        }
      } catch (err: any) {
        await prisma.rewardOutbox.update({
          where: { id: item.id },
          data: {
            retryCount: { increment: 1 },
            lastError: err?.message || String(err),
          },
        });
        errors++;
      }
    }
  } catch (err) {
    console.error('Outbox processor error:', err);
  }

  return { processed, errors };
}

/**
 * Manual adjustment with mandatory reason
 */
export async function manualAdjustXP(
  actorId: string,
  actorRole: string,
  targetUserId: string,
  amount: number,
  reason: string
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  if (!reason || reason.trim().length < 5) {
    return { success: false, error: 'A descriptive reason of at least 5 characters is mandatory for manual adjustments.' };
  }

  const isDeduction = amount < 0;
  const absAmount = Math.abs(amount);

  try {
    const result = await prisma.$transaction(async (tx) => {
      if (isDeduction) {
        const bal = await tx.rewardBalance.findUnique({ where: { userId: targetUserId } });
        if (!bal || bal.balance < absAmount) {
          throw new Error(`Cannot deduct ${absAmount} XP: user current balance is ${bal?.balance || 0}`);
        }
      }

      const txRecord = await tx.rewardTransaction.create({
        data: {
          userId: targetUserId,
          type: 'ADJUST',
          xpAmount: absAmount,
          referenceId: actorId,
          idempotencyKey: `adj:${targetUserId}:${Date.now()}`,
          description: `Manual adjustment by admin (${reason})`,
          processedVia: 'DIRECT',
        },
      });

      const updatedBalance = await tx.rewardBalance.upsert({
        where: { userId: targetUserId },
        create: {
          userId: targetUserId,
          totalEarned: isDeduction ? 0 : absAmount,
          balance: isDeduction ? 0 : absAmount,
          totalRedeemed: 0,
        },
        update: {
          balance: isDeduction ? { decrement: absAmount } : { increment: absAmount },
          ...(isDeduction ? {} : { totalEarned: { increment: absAmount } }),
        },
      });

      // Audit Log
      await tx.rewardAuditLog.create({
        data: {
          actorId,
          actorRole,
          targetUserId,
          action: 'MANUAL_XP_ADJUST',
          detail: JSON.stringify({
            amount,
            reason,
            resultingBalance: updatedBalance.balance,
            transactionId: txRecord.id,
          }),
        },
      });

      return updatedBalance;
    });

    return { success: true, newBalance: result.balance };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Manual adjustment failed.' };
  }
}
