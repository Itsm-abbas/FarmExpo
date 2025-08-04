import prisma from "../../../../lib/prisma";
import { signupSchema } from "../../../../lib/validations/user";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { verifyToken } from "../../../../lib/auth";

export async function POST(req) {
  const body = await req.json();
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
  }

  const token = req.cookies.get("token")?.value;
  const creator = verifyToken(token);

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (existing) {
    return NextResponse.json({ error: "User already exists" }, { status: 400 });
  }

  const hashed = await bcrypt.hash(parsed.data.password, 10);

  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      password: hashed,
      name: parsed.data.name,
      role: creator ? "user" : "admin",
      createdById: creator?.id || null,
    },
  });

  return NextResponse.json({ message: "User created" });
}
