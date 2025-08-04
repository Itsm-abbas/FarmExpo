import prisma from "@lib/prisma";
import bcrypt from "bcrypt";
import { signupSchema } from "@lib/validations/user";
import { NextResponse } from "next/server";
import { requireAdminFromRequest } from "@lib/authMiddleware";

export async function POST(req) {
  const admin = requireAdminFromRequest();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = signupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (existing) {
    return NextResponse.json({ error: "User already exists" }, { status: 400 });
  }

  const hashed = await bcrypt.hash(parsed.data.password, 10);

  const createdUser = await prisma.user.create({
    data: {
      email: parsed.data.email,
      name: parsed.data.name,
      password: hashed,
      role: "user",
      createdById: admin.id, // ✅ NOW it will be set properly
    },
  });

  return NextResponse.json({ message: "User created by admin" });
}
