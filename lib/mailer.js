import nodemailer from "nodemailer";

// Email is sent through any SMTP server (Gmail with an app password, Outlook,
// Zoho, SendGrid, Mailgun, Amazon SES...). Configure in .env:
//   SMTP_HOST, SMTP_PORT (465 = TLS, 587 = STARTTLS), SMTP_USER, SMTP_PASS,
//   SMTP_FROM (e.g. "FarmExpo <no-reply@yourdomain.com>")
export function isEmailConfigured() {
  return Boolean(process.env.SMTP_HOST);
}

let transporter;
function getTransporter() {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 587);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
  }
  return transporter;
}

export async function sendEmail({ to, subject, text, html }) {
  if (!isEmailConfigured()) {
    // Without SMTP (local development) the message goes to the server log.
    console.info(`[email not sent: SMTP_HOST is not set]\nTo: ${to}\nSubject: ${subject}\n\n${text}`);
    return false;
  }
  await getTransporter().sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html,
  });
  return true;
}
