import nodemailer from 'nodemailer';

/**
 * Secure Email Service for ScholarSync.
 * Sends notification and authentication emails.
 * Never logs sensitive credential values (OTPs, passwords, reset tokens).
 */
export async function sendPasswordResetEmail(recipientEmail, otpCode) {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Check if SMTP environment variables are configured
  const smtpHost = process.env.SMTP_HOST || process.env.EMAIL_HOST;
  const smtpPort = process.env.SMTP_PORT || process.env.EMAIL_PORT || 587;
  const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: Number(smtpPort),
        secure: Number(smtpPort) === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from: process.env.EMAIL_FROM || '"ScholarSync Security" <no-reply@scholarsync.com>',
        to: recipientEmail,
        subject: 'ScholarSync — Password Reset Verification Code',
        text: `Your ScholarSync password reset verification code is: ${otpCode}. This code will expire in 10 minutes. If you did not request a password reset, please ignore this email.`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0f172a; color: #f8fafc; border-radius: 8px;">
            <h2 style="color: #6366f1;">ScholarSync Password Reset</h2>
            <p>You requested a password reset for your ScholarSync account.</p>
            <p>Your 6-digit verification code is:</p>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #818cf8; margin: 20px 0;">${otpCode}</div>
            <p>This code will expire in <strong>10 minutes</strong>. If you did not request this, please secure your account immediately.</p>
          </div>
        `,
      });

      console.log(`[EmailService] Password reset verification code email sent successfully to ${recipientEmail}`);
      return true;
    } catch (err) {
      console.error(`[EmailService] Failed to send email to ${recipientEmail}:`, err.message);
      return false;
    }
  }

  // Fallback when SMTP credentials are not configured:
  // Operational log ONLY (never log the actual OTP value or token)
  console.log(`[EmailService] SMTP credentials not configured. Verification email simulated for ${recipientEmail}.`);
  return true;
}
