import crypto from 'crypto';

export interface VoucherOrderRequest {
  redemptionId: string;
  userId: string;
  rewardId: string;
  brand: string;
  amount: number;
}

export interface VoucherOrderResponse {
  success: boolean;
  voucherCode?: string;
  voucherPin?: string;
  expiryDate?: string;
  providerReference?: string;
  error?: string;
}

export interface IVoucherProviderAdapter {
  orderVoucher(req: VoucherOrderRequest): Promise<VoucherOrderResponse>;
}

/**
 * Development & Hackathon Adapter
 * Safely generates structured dummy voucher codes without connecting to live payment rails.
 * To integrate with Xoxoday or Pine Labs in production, implement IVoucherProviderAdapter
 * and supply the necessary API credentials in environment variables.
 */
export class MockVoucherAdapter implements IVoucherProviderAdapter {
  async orderVoucher(req: VoucherOrderRequest): Promise<VoucherOrderResponse> {
    // Generate deterministic yet pseudo-random dummy voucher code
    const brandClean = req.brand.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() || 'DEMO';
    const randPart1 = crypto.randomBytes(2).toString('hex').toUpperCase();
    const randPart2 = crypto.randomBytes(2).toString('hex').toUpperCase();
    const code = `DUMMY-${brandClean}-${randPart1}-${randPart2}`;

    // Expiry date set to 1 year from now
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 1);

    return {
      success: true,
      voucherCode: code,
      voucherPin: Math.floor(1000 + Math.random() * 9000).toString(),
      expiryDate: expiry.toISOString(),
      providerReference: `MOCK-${Date.now()}-${req.redemptionId.slice(0, 8)}`,
    };
  }
}

// Global default voucher provider instance
export const voucherProvider: IVoucherProviderAdapter = new MockVoucherAdapter();
