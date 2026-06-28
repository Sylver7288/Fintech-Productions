import nodemailer from "nodemailer";

const host = process.env.SMTP_HOST;
const port = parseInt(process.env.SMTP_PORT || "587", 10);
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const from = process.env.SMTP_FROM || '"Novamoni" <no-reply@novamoni.com>';

let transporter: any = null;

if (host && user && pass) {
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
}

export async function sendOtpEmail(email: string, otp: string) {
  if (transporter) {
    try {
      await transporter.sendMail({
        from,
        to: email,
        subject: "Verify your email address - Novamoni",
        text: `Your email verification code is: ${otp}. This code expires in 10 minutes.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #4f46e5; margin: 0; font-size: 24px;">Verify Your Email Address</h2>
              <p style="color: #6b7280; font-size: 14px; margin-top: 5px;">Novamoni Account Security</p>
            </div>
            <p style="color: #374151; font-size: 15px; line-height: 1.5;">Hello,</p>
            <p style="color: #374151; font-size: 15px; line-height: 1.5;">Thank you for choosing <strong>Novamoni</strong>. Use the following verification code to complete your verification process:</p>
            <div style="font-size: 36px; font-weight: bold; text-align: center; margin: 30px auto; padding: 15px; background-color: #f3f4f6; color: #1f2937; letter-spacing: 6px; border-radius: 8px; width: fit-content; border: 1px dashed #d1d5db;">
              ${otp}
            </div>
            <p style="color: #374151; font-size: 14px; line-height: 1.5;">This code will expire in <strong>10 minutes</strong>. If you did not request this verification, please ignore this email.</p>
            <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 25px 0;" />
            <p style="font-size: 11px; color: #9ca3af; text-align: center;">&copy; ${new Date().getFullYear()} Novamoni. All rights reserved.</p>
          </div>
        `,
      });
      console.log(`[SMTP] Sent OTP email successfully to ${email}`);
    } catch (err) {
      console.error("[SMTP ERROR] Failed to send email via SMTP", err);
    }
  } else {
    console.log(`[SIMULATED EMAIL LOG] SMTP not configured. OTP code ${otp} was generated for ${email}`);
  }
}
