import { isSafeExternalUrl } from '../urlSafetyChecker';

export interface VerificationResult {
  verified: boolean;
  status: 'APPROVED' | 'UNDER_REVIEW' | 'REJECTED';
  reason?: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  details?: Record<string, any>;
}

export async function verifyNptelCertificate(
  certId: string,
  verificationUrl: string,
  courseName: string
): Promise<VerificationResult> {
  const urlCheck = await isSafeExternalUrl(verificationUrl);
  if (!urlCheck.safe) {
    return {
      verified: false,
      status: 'REJECTED',
      reason: `Unsafe or invalid verification URL: ${urlCheck.reason}`,
      confidence: 'HIGH',
    };
  }

  const parsedUrl = new URL(verificationUrl);
  const hostname = parsedUrl.hostname.toLowerCase();

  // NPTEL certificates must be on nptel.ac.in or archive.nptel.ac.in
  const isAllowedDomain = hostname === 'nptel.ac.in' || hostname.endsWith('.nptel.ac.in');
  if (!isAllowedDomain) {
    return {
      verified: false,
      status: 'REJECTED',
      reason: 'NPTEL certificate verification URL must point to nptel.ac.in domain.',
      confidence: 'HIGH',
    };
  }

  // Validate NPTEL Certificate ID format (typically starts with NPTEL followed by 2 digits of year, e.g., NPTEL24CS101S...)
  const certIdPattern = /^NPTEL\d{2}[A-Z]{2,4}\d{2,6}/i;
  const matchesFormat = certIdPattern.test(certId.trim());

  if (!matchesFormat) {
    return {
      verified: false,
      status: 'UNDER_REVIEW',
      reason: 'Certificate ID does not match standard NPTEL format (e.g., NPTEL24CS101...). Flagged for manual review.',
      confidence: 'MEDIUM',
    };
  }

  // If URL and Cert format match official standard, move to UNDER_REVIEW for admin sign-off or instant approval
  return {
    verified: true,
    status: 'UNDER_REVIEW',
    reason: 'NPTEL domain and certificate ID format validated. Queued for final reviewer confirmation.',
    confidence: 'HIGH',
    details: {
      domain: hostname,
      certIdPatternMatched: true,
      provider: 'NPTEL',
    },
  };
}
