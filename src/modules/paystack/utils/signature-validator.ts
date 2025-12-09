import * as crypto from 'crypto';

export class SignatureValidator {
  /**
   * Validates Paystack webhook signature
   * @param rawBody - Raw request body as string or Buffer
   * @param signature - x-paystack-signature header value
   * @param secretKey - Paystack secret key
   * @returns true if signature is valid
   */
  static validateSignature(
    rawBody: string | Buffer,
    signature: string,
    secretKey: string,
  ): boolean {
    const hash = crypto
      .createHmac('sha512', secretKey)
      .update(rawBody)
      .digest('hex');

    return hash === signature;
  }
}
