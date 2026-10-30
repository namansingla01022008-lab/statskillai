import { isSafeExternalUrl } from '../urlSafetyChecker';
import { VerificationResult } from './nptelAdapter';

export async function verifyIgotCertificate(
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

  const isAllowedDomain = hostname === 'igotkarmayogi.gov.in' || hostname.endsWith('.igotkarmayogi.gov.in') || hostname.endsWith('.karmayogi.gov.in');
  if (!isAllowedDomain) {
    return {
      verified: false,
      status: 'REJECTED',
      reason: 'iGOT Karmayogi verification URL must be under official igotkarmayogi.gov.in domain.',
      confidence: 'HIGH',
    };
  }

  return {
    verified: true,
    status: 'UNDER_REVIEW',
    reason: 'Official Mission Karmayogi portal validated. Routed to nodal officer verification queue.',
    confidence: 'MEDIUM',
    details: {
      domain: hostname,
      provider: 'iGOT',
    },
  };
}
