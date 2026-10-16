import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { TransactionalEmailsApi, TransactionalEmailsApiApiKeys, SendSmtpEmail } from '@getbrevo/brevo';
import { config } from '../config/index.js';
import { CustomerSessionPayload } from '../types/index.js';

export class BrevoService {
  private apiInstance: TransactionalEmailsApi;
  private isConfigured: boolean;

  constructor() {
    this.apiInstance = new TransactionalEmailsApi();
    const apiKey = config.brevo.apiKey?.trim();
    if (apiKey && apiKey.startsWith('xkeysib-') && apiKey !== 'xkeysib-placeholder-brevo-api-key') {
      this.apiInstance.setApiKey(TransactionalEmailsApiApiKeys.apiKey, apiKey);
      this.isConfigured = true;
    } else {
      this.isConfigured = false;
    }
  }

  /**
   * Generates a secure, cryptographically random 6-digit numeric OTP.
   */
  public generateOtp(): string {
    return crypto.randomInt(100000, 1000000).toString();
  }

  /**
   * Computes a salted HMAC-SHA256 hash of the OTP bound to the recipient email.
   */
  public hashOtp(otp: string, email: string): string {
    return crypto
      .createHmac('sha256', config.jwtSecret)
      .update(`${email.toLowerCase().trim()}:${otp.trim()}`)
      .digest('hex');
  }

  /**
   * Verifies the user-entered OTP against the stored salted hash.
   */
  public verifyOtpHash(otp: string, email: string, storedHash: string): boolean {
    const candidateHash = this.hashOtp(otp, email);
    try {
      return crypto.timingSafeEqual(
        Buffer.from(candidateHash, 'hex'),
        Buffer.from(storedHash, 'hex')
      );
    } catch {
      return false;
    }
  }

  /**
   * Sends transactional email containing the 6-digit verification code.
   * Gracefully falls back to mock logger when credentials are not configured or in test mode.
   */
  public async sendOtpEmail(email: string, otp: string, restaurantName: string = 'Our Restaurant'): Promise<{
    delivered: boolean;
    isMock: boolean;
    messageId?: string;
  }> {
    const isMock = !this.isConfigured || process.env.NODE_ENV === 'test';

    if (isMock) {
      console.log(`\n======================================================`);
      console.log(`[BREVO MOCK EMAIL OTP] To: ${email}`);
      console.log(`Restaurant: ${restaurantName}`);
      console.log(`Your 6-digit verification code: >>> ${otp} <<<`);
      console.log(`Valid for 5 minutes.`);
      console.log(`======================================================\n`);
      return { delivered: true, isMock: true, messageId: `mock-${Date.now()}` };
    }

    try {
      const sendSmtpEmail = new SendSmtpEmail();
      sendSmtpEmail.subject = `${otp} is your verification code for ${restaurantName}`;
      sendSmtpEmail.sender = {
        name: config.brevo.senderName,
        email: config.brevo.senderEmail,
      };
      sendSmtpEmail.to = [{ email: email.toLowerCase().trim() }];
      sendSmtpEmail.htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background: #ffffff;">
          <h2 style="color: #111827; margin-top: 0;">Confirm Your Order at ${restaurantName}</h2>
          <p style="color: #4b5563; font-size: 15px; line-height: 24px;">Use the verification code below to verify your email and place your order:</p>
          <div style="margin: 28px 0; text-align: center;">
            <span style="display: inline-block; font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #1e293b; background: #f1f5f9; padding: 12px 24px; border-radius: 8px; border: 1px solid #cbd5e1;">${otp}</span>
          </div>
          <p style="color: #64748b; font-size: 13px;">This code will expire in <strong>5 minutes</strong>. If you did not request this code, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">Powered by Sudarshan QR Restaurant System</p>
        </div>
      `;

      const response = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      return { delivered: true, isMock: false, messageId: (response as any)?.body?.messageId };
    } catch (error: any) {
      console.error('[Brevo Email Error]:', error?.response?.body || error.message);
      throw new Error(`Failed to send verification email: ${error.message}`);
    }
  }

  /**
   * Issues a signed customer session token after successful OTP verification.
   */
  public generateCustomerSessionToken(payload: Omit<CustomerSessionPayload, 'type'>): string {
    const sessionPayload: CustomerSessionPayload = {
      ...payload,
      type: 'CUSTOMER_SESSION',
    };
    return jwt.sign(sessionPayload, config.jwtSecret, { expiresIn: '4h' });
  }
}

export const brevoService = new BrevoService();
