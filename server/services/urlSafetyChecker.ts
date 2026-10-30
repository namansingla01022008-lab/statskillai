import dns from 'dns/promises';

const BLOCKED_IP_PREFIXES = [
  '127.',
  '10.',
  '192.168.',
  '172.16.',
  '172.17.',
  '172.18.',
  '172.19.',
  '172.20.',
  '172.21.',
  '172.22.',
  '172.23.',
  '172.24.',
  '172.25.',
  '172.26.',
  '172.27.',
  '172.28.',
  '172.29.',
  '172.30.',
  '172.31.',
  '169.254.', // Link-local / Cloud metadata (AWS, GCP, Azure)
  '0.',
  '::1',
  'fe80:',
  'fc00:',
  'fd00:',
];

export async function isSafeExternalUrl(rawUrl: string): Promise<{ safe: boolean; reason?: string }> {
  try {
    const parsed = new URL(rawUrl);

    // Require HTTPS only
    if (parsed.protocol !== 'https:') {
      return { safe: false, reason: 'Only secure HTTPS URLs are permitted.' };
    }

    const hostname = parsed.hostname.toLowerCase();

    // Disallow localhost or single-word domains
    if (hostname === 'localhost' || !hostname.includes('.')) {
      return { safe: false, reason: 'Localhost and unqualified domains are not allowed.' };
    }

    // Direct IP string checks
    for (const prefix of BLOCKED_IP_PREFIXES) {
      if (hostname.startsWith(prefix)) {
        return { safe: false, reason: 'Requests to internal or private IP ranges are blocked.' };
      }
    }

    // Resolve DNS with a 3-second timeout to prevent DNS-rebinding or internal routing
    try {
      const addresses = await Promise.race([
        dns.resolve(hostname),
        new Promise<string[]>((_, reject) => setTimeout(() => reject(new Error('DNS lookup timeout')), 3000)),
      ]);

      for (const ip of addresses) {
        for (const prefix of BLOCKED_IP_PREFIXES) {
          if (ip.startsWith(prefix)) {
            return { safe: false, reason: 'Target domain resolves to an internal/private IP address.' };
          }
        }
      }
    } catch (err: any) {
      // If DNS resolution fails, reject safely
      return { safe: false, reason: `DNS resolution failed or timed out: ${err?.message || err}` };
    }

    return { safe: true };
  } catch (err: any) {
    return { safe: false, reason: 'Malformed or invalid URL.' };
  }
}
