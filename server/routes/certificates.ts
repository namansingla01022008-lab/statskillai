import { Router, Response } from 'express';
import { prisma } from '../db';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { verifyCertificateSubmission } from '../services/certVerification';
import { ensurePrismaSchema } from '../services/dbSync';

const router = Router();

function isMissingTableError(err: any): boolean {
  return (
    err?.code === 'P2021' ||
    Boolean(err?.message && (err.message.includes('does not exist') || err.message.includes('not exist in the current database')))
  );
}

// POST /api/certificates/submit - Submit a certificate for verification
router.post('/submit', authenticate, requireRole(['learner', 'admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { courseName, provider, certId, verificationUrl, fileKey } = req.body;

    // 1. Basic field presence validation
    if (!courseName || !provider || !certId || !verificationUrl) {
      return res.status(400).json({
        error: 'courseName, provider, certId, and verificationUrl are required fields.',
      });
    }

    const cleanCourseName = String(courseName).trim();
    const cleanProvider = String(provider).trim();
    const cleanCertId = String(certId).trim();
    const cleanUrl = String(verificationUrl).trim();

    // 2. Duplicate submission check (with auto table creation recovery)
    let existing;
    try {
      existing = await prisma.certificate.findUnique({
        where: {
          userId_provider_certId: {
            userId,
            provider: cleanProvider,
            certId: cleanCertId,
          },
        },
      });
    } catch (findErr: any) {
      if (isMissingTableError(findErr)) {
        await ensurePrismaSchema();
        existing = await prisma.certificate.findUnique({
          where: {
            userId_provider_certId: {
              userId,
              provider: cleanProvider,
              certId: cleanCertId,
            },
          },
        });
      } else {
        throw findErr;
      }
    }

    if (existing) {
      return res.status(409).json({
        error: `A certificate with ID '${cleanCertId}' for provider '${cleanProvider}' has already been submitted.`,
        certificate: existing,
      });
    }

    // 3. Run provider-specific verification adapter for pre-validation inspection
    let verificationNote = 'Submitted by learner. Queued for admin verification.';
    try {
      const verification = await verifyCertificateSubmission(
        cleanProvider,
        cleanCertId,
        cleanUrl,
        cleanCourseName
      );
      if (verification?.reason) {
        verificationNote = verification.reason;
      }
    } catch (checkErr: any) {
      console.warn('Initial adapter inspection note:', checkErr?.message || checkErr);
    }

    // 4. Save certificate record with PENDING status (with auto table creation recovery)
    let certificate;
    try {
      certificate = await prisma.certificate.create({
        data: {
          userId,
          courseName: cleanCourseName,
          provider: cleanProvider,
          certId: cleanCertId,
          verificationUrl: cleanUrl,
          fileKey: fileKey ? String(fileKey).trim() : null,
          status: 'PENDING',
          adminNote: verificationNote,
          rejectionReason: null,
          xpAwarded: false,
        },
      });
    } catch (createErr: any) {
      if (isMissingTableError(createErr)) {
        await ensurePrismaSchema();
        certificate = await prisma.certificate.create({
          data: {
            userId,
            courseName: cleanCourseName,
            provider: cleanProvider,
            certId: cleanCertId,
            verificationUrl: cleanUrl,
            fileKey: fileKey ? String(fileKey).trim() : null,
            status: 'PENDING',
            adminNote: verificationNote,
            rejectionReason: null,
            xpAwarded: false,
          },
        });
      } else {
        throw createErr;
      }
    }

    res.status(201).json({
      success: true,
      certificate,
      message: 'Certificate uploaded and queued for admin verification! Once verified, your XP rewards will be automatically awarded.',
    });
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return res.status(409).json({
        error: 'This certificate has already been submitted.',
      });
    }
    console.error('Submit certificate error:', err);
    res.status(500).json({ error: err?.message || 'Failed to submit certificate.' });
  }
});

// GET /api/certificates/my - List current learner's submitted certificates
router.get('/my', authenticate, requireRole(['learner', 'admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    let certificates = [];
    try {
      certificates = await prisma.certificate.findMany({
        where: { userId },
        orderBy: { submittedAt: 'desc' },
      });
    } catch (fetchErr: any) {
      if (isMissingTableError(fetchErr)) {
        await ensurePrismaSchema();
        certificates = await prisma.certificate.findMany({
          where: { userId },
          orderBy: { submittedAt: 'desc' },
        });
      } else {
        throw fetchErr;
      }
    }

    res.json({ success: true, certificates });
  } catch (err: any) {
    console.error('Fetch my certificates error:', err);
    res.status(500).json({ error: err?.message || 'Failed to fetch certificates.' });
  }
});

// GET /api/certificates/:id - Single certificate detail
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const role = req.user!.role;

    let cert;
    try {
      cert = await prisma.certificate.findUnique({
        where: { id },
      });
    } catch (fetchErr: any) {
      if (isMissingTableError(fetchErr)) {
        await ensurePrismaSchema();
        cert = await prisma.certificate.findUnique({
          where: { id },
        });
      } else {
        throw fetchErr;
      }
    }

    if (!cert) {
      return res.status(404).json({ error: 'Certificate not found.' });
    }

    if (role !== 'admin' && cert.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized to view this certificate.' });
    }

    res.json({ success: true, certificate: cert });
  } catch (err: any) {
    console.error('Fetch certificate error:', err);
    res.status(500).json({ error: err?.message || 'Failed to fetch certificate.' });
  }
});

export default router;
