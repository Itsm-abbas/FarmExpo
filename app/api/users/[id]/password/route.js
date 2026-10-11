import prisma from "@lib/prisma";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import { HttpError, withUser } from "@lib/session";
import { findMember } from "@lib/users";

// An admin sets a new password for a member (e.g. staff who forgot theirs).
// The member's existing sessions are signed out.
export const POST = withUser(
  async (req, { user: admin, params }) => {
    const user = await findMember(admin, params.id);
    const { password } = await req.json();
    if (typeof password !== "string" || password.length < 6) {
      throw new HttpError(400, "Password must be at least 6 characters");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: await bcrypt.hash(password, 10),
        passwordChangedAt: new Date(),
        resetTokenHash: null,
        resetTokenExpiresAt: null,
      },
    });

    return NextResponse.json({ message: "Password updated" });
  },
  { can: "manageUsers" }
);
