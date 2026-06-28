import { logger } from "./logger";

export async function sendOtpSms(phone: string, otp: string): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    logger.info(
      { phone, otp },
      `[SIMULATED SMS LOG] Twilio not configured. OTP code ${otp} was generated for phone ${phone}`
    );
    return;
  }

  // Format local Nigerian numbers (e.g., 08031234567 -> +2348031234567)
  let formattedPhone = phone.trim();
  if (formattedPhone.startsWith("0") && formattedPhone.length === 11) {
    formattedPhone = "+234" + formattedPhone.substring(1);
  } else if (!formattedPhone.startsWith("+")) {
    formattedPhone = "+" + formattedPhone;
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

    const params = new URLSearchParams();
    params.append("From", fromNumber);
    params.append("To", formattedPhone);
    params.append("Body", `Your Novamonie verification code is: ${otp}. This code expires in 10 minutes.`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errText = await response.text();
      logger.error({ errText, phone: formattedPhone }, "[Twilio SMS] Failed to send SMS");
    } else {
      logger.info({ phone: formattedPhone }, "[Twilio SMS] Sent OTP SMS successfully");
    }
  } catch (err: any) {
    logger.error({ err, phone: formattedPhone }, "[Twilio SMS] Error sending SMS");
  }
}
