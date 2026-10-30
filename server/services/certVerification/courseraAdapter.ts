import { isSafeExternalUrl } from '../urlSafetyChecker';
import { VerificationResult } from './nptelAdapter';

export async function verifyCourseraCertificate(
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

  const isCourseraDomain = hostname === 'coursera.org' || hostname.endsWith('.coursera.org');
  if (!isCourseraDomain) {
    return {
      verified: false,
      status: 'REJECTED',
      reason: 'Coursera certificate URL must point to coursera.org/verify domain.',
      confidence: 'HIGH',
    };
  }

  // Coursera URL pattern: https://coursera.org/verify/<certId> or /verify/professional-cert/<certId>
  const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
  const isVerifyPath = pathParts[0] === 'verify';
  const urlCertId = pathParts[pathParts.length - 1];

  if (!isVerifyPath) {
    return {
      verified: false,
      status: 'REJECTED',
      reason: 'Coursera URL must follow the format https://www.coursera.org/verify/{certificateId}',
      confidence: 'HIGH',
    };
  }

  // Cross-match certId in input with certId in URL path if both provided
  if (certId && urlCertId && certId.trim().toUpperCase() !== urlCertId.trim().toUpperCase()) {
    return {
      verified: false,
      status: 'UNDER_REVIEW',
      reason: 'Mismatch between submitted certificate ID and the ID found in the verification URL.',
      confidence: 'MEDIUM',
    };
  }

  return {
    verified: true,
    status: 'UNDER_REVIEW',
    reason: 'Coursera verification route validated. Ready for reviewer inspection.',
    confidence: 'HIGH',
    details: {
      domain: hostname,
      matchedCertId: urlCertId || certId,
      provider: 'Coursera',
    },
  };
}
