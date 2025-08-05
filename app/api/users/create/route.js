import prisma from "@lib/prisma";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import { verifyToken } from "@lib/auth";

export async function POST(req) {
  const token = req.cookies.get("token")?.value;
  const user = verifyToken(token);
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { email, name, password } = await req.json();

  // const parsed = signupSchema.safeParse(body);

  // if (!parsed.success) {
  //   return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
  // }

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    return NextResponse.json({ error: "User already exists" }, { status: 400 });
  }

  const hashed = await bcrypt.hash(password, 10);

  const createdUser = await prisma.user.create({
    data: {
      email,
      name,
      password: hashed,
      role: "user",
      createdById: user.id,
    },
  });

  return NextResponse.json({ message: "User created by admin" });
}
