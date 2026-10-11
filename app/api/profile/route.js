import { findUserByEmail } from "@lib/users";
import { NextResponse } from "next/server";
import prisma from "@lib/prisma";
import bcrypt from "bcrypt";
import { HttpError, withUser } from "@lib/session";
import { SESSION_COOKIE, generateToken } from "@lib/auth";

export const PUT = withUser(async (req, { user }) => {
  const { name, email, currentPassword, newPassword } = await req.json();

  const currentUser = await prisma.user.findUnique({
    where: { id: user.id },
  });

  const updateData = {};
  if (typeof name === "string") updateData.name = name.trim();
  if (typeof email === "string" && email.trim()) {
    const normalized = email.trim();
    const taken = await findUserByEmail(normalized);
    if (taken && taken.id !== currentUser.id) {
      throw new HttpError(400, "That email is already in use");
    }
    updateData.email = normalized;
  }

  // If changing password, verify current password and hash new one
  if (currentPassword || newPassword) {
    if (!currentPassword || !newPassword) {
      throw new HttpError(400, "Current and new password are both required");
    }
    if (newPassword.length < 6) {
      throw new HttpError(400, "Password must be at least 6 characters");
    }
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      currentUser.password
    );
    if (!isCurrentPasswordValid) {
      throw new HttpError(400, "Current password is incorrect");
    }
    updateData.password = await bcrypt.hash(newPassword, 12);
    // Signs out every other session; this one gets a fresh token below.
    updateData.passwordChangedAt = new Date();
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  const res = NextResponse.json({
    message: "Profile updated successfully",
    user: updatedUser,
  });
  if (updateData.password) {
    res.cookies.set("token", generateToken(updatedUser), SESSION_COOKIE);
  }
  return res;
});
