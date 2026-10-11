import { findUserByEmail } from "@lib/users";
import prisma from "@lib/prisma";
import { signupSchema } from "@lib/validations/user";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { TX_OPTIONS, getSessionUser } from "@lib/session";

// Public sign-up: creates a new organization with the person as its admin.
// Admins add staff to an existing organization from Manage users instead.
export async function POST(req) {
  const body = await req.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter a valid email and a password of at least 6 characters." },
      { status: 400 }
    );
  }

  if (await getSessionUser(req)) {
    return NextResponse.json(
      { error: "You're already signed in. Add people from Manage users." },
      { status: 400 }
    );
  }

  const { email, password, name, organizationName } = parsed.data;
  const existing = await findUserByEmail(email);
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 400 }
    );
  }

  const hashed = await bcrypt.hash(password, 10);
  const fallbackName = `${name || email.split("@")[0]}'s organization`;

  await prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: { name: organizationName || fallbackName, email },
    });
    await tx.user.create({
      data: {
        email,
        password: hashed,
        name,
        role: "admin",
        organizationId: organization.id,
      },
    });
  }, TX_OPTIONS);

  return NextResponse.json({ message: "Account created" });
}
