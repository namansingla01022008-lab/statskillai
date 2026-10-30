import { VerificationResult } from './nptelAdapter';
import { verifyNptelCertificate } from './nptelAdapter';
import { verifySwayamCertificate } from './swayamAdapter';
import { verifyCourseraCertificate } from './courseraAdapter';
import { verifyIgotCertificate } from './iGOTAdapter';
import { isSafeExternalUrl } from '../urlSafetyChecker';

export async function verifyCertificateSubmission(
  provider: string,
  certId: string,
  verificationUrl: string,
  courseName: string
): Promise<VerificationResult> {
  const normProvider = (provider || '').trim().toLowerCase();

  if (normProvider === 'nptel') {
    return verifyNptelCertificate(certId, verificationUrl, courseName);
  }

  if (normProvider === 'swayam') {
    return verifySwayamCertificate(certId, verificationUrl, courseName);
  }

  if (normProvider === 'coursera') {
    return verifyCourseraCertificate(certId, verificationUrl, courseName);
  }

  if (normProvider === 'igot' || normProvider === 'igot karmayogi') {
    return verifyIgotCertificate(certId, verificationUrl, courseName);
  }

  // Fallback for "Other" or custom recognized provider
  const urlCheck = await isSafeExternalUrl(verificationUrl);
  if (!urlCheck.safe) {
    return {
      verified: false,
      status: 'REJECTED',
      reason: `Unsafe or invalid verification URL: ${urlCheck.reason}`,
      confidence: 'HIGH',
    };
  }

  return {
    verified: true,
    status: 'UNDER_REVIEW',
    reason: 'Non-standard provider URL validated for safety. Queued for manual admin inspection.',
    confidence: 'LOW',
    details: {
      provider,
    },
  };
}
