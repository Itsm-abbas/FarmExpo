import prisma from "@lib/prisma";
import { NextResponse } from "next/server";
import { findUserByEmail } from "@lib/users";
import { sendEmail } from "@lib/mailer";
import { appUrl, newResetToken, recentlySent } from "@lib/passwordReset";

// Emails a one-hour reset link. The response is the same whether or not the
// account exists, so this can't be used to find out who has an account.
export async function POST(req) {
  const { email } = (await req.json().catch(() => null)) || {};
  if (typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email.trim())) {
    return NextResponse.json(
      { error: "Enter the email address you sign in with." },
      { status: 400 }
    );
  }

  const done = NextResponse.json({
    message:
      "If an account uses that email, we've sent it a link to reset the password.",
  });

  const user = await findUserByEmail(email.trim());
  if (!user || recentlySent(user)) return done;

  const baseUrl = appUrl(req);
  if (!baseUrl) {
    console.error("Password reset not sent: set APP_URL in the environment.");
    return done;
  }

  const { token, resetTokenHash, resetTokenExpiresAt } = newResetToken();
  await prisma.user.update({
    where: { id: user.id },
    data: { resetTokenHash, resetTokenExpiresAt },
  });

  const link = `${baseUrl}/auth/reset-password?token=${token}`;
  try {
    await sendEmail({
      to: user.email,
      subject: "Reset your FarmExpo password",
      text: [
        `Hi ${user.name || ""}`.trim() + ",",
        "",
        "Use this link to choose a new password. It works for one hour:",
        link,
        "",
        "If you didn't ask to reset your password, you can ignore this email.",
      ].join("\n"),
      html: `<p>Hi ${escapeHtml(user.name || "")},</p>
<p>Use this link to choose a new password. It works for one hour.</p>
<p><a href="${link}">Reset your password</a></p>
<p>If you didn't ask to reset your password, you can ignore this email.</p>`,
    });
  } catch (err) {
    console.error("Password reset email failed:", err);
  }

  return done;
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
