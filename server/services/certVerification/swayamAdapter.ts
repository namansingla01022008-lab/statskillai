import { isSafeExternalUrl } from '../urlSafetyChecker';
import { VerificationResult } from './nptelAdapter';

export async function verifySwayamCertificate(
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

  // SWAYAM certificates must point to swayam.gov.in or swayam2.gov.in
  const isAllowedDomain = hostname === 'swayam.gov.in' || hostname.endsWith('.swayam.gov.in');
  if (!isAllowedDomain) {
    return {
      verified: false,
      status: 'REJECTED',
      reason: 'SWAYAM certificate verification URL must point to an official swayam.gov.in domain.',
      confidence: 'HIGH',
    };
  }

  if (!certId || certId.trim().length < 4) {
    return {
      verified: false,
      status: 'REJECTED',
      reason: 'A valid SWAYAM certificate identification number is required.',
      confidence: 'HIGH',
    };
  }

  return {
    verified: true,
    status: 'UNDER_REVIEW',
    reason: 'Official SWAYAM portal domain validated. Certificate details ready for manual verification.',
    confidence: 'MEDIUM',
    details: {
      domain: hostname,
      provider: 'SWAYAM',
    },
  };
}
