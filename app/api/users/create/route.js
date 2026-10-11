import { findUserByEmail } from "@lib/users";
import prisma from "@lib/prisma";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import { signupSchema } from "@lib/validations/user";
import { withUser } from "@lib/session";

// Adds a member to the admin's organization. They work on the organization's
// data; as "user" (staff) their access is limited (see ROLE_PERMISSIONS).
export const POST = withUser(
  async (req, { user }) => {
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "A valid email and a password of 6+ characters are required" },
        { status: 400 }
      );
    }
    const { email, name, password } = parsed.data;
    const role = body.role === "admin" ? "admin" : "user";

    const existing = await findUserByEmail(email);

    if (existing) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 400 }
      );
    }

    const hashed = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        email,
        name,
        password: hashed,
        role,
        organizationId: user.organizationId,
        createdById: user.id,
      },
    });

    return NextResponse.json({ message: "User added" });
  },
  { can: "manageUsers" }
);
