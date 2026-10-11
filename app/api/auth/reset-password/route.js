import prisma from "@lib/prisma";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import { hashResetToken } from "@lib/passwordReset";

// Sets a new password from an emailed reset link. The link works once, and
// every existing session of the account is signed out.
export async function POST(req) {
  const { token, password } = (await req.json().catch(() => null)) || {};
  if (typeof password !== "string" || password.length < 6) {
    return NextResponse.json(
      { error: "Choose a password of at least 6 characters." },
      { status: 400 }
    );
  }

  const user =
    typeof token === "string" && token
      ? await prisma.user.findFirst({
          where: {
            resetTokenHash: hashResetToken(token),
            resetTokenExpiresAt: { gt: new Date() },
          },
        })
      : null;
  if (!user) {
    return NextResponse.json(
      { error: "This reset link has expired or was already used. Request a new one." },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: await bcrypt.hash(password, 10),
      resetTokenHash: null,
      resetTokenExpiresAt: null,
      passwordChangedAt: new Date(),
    },
  });

  return NextResponse.json({ message: "Password updated. You can sign in now." });
}
