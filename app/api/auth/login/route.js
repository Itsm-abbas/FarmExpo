import prisma from "@lib/prisma";
import { loginSchema } from "@lib/validations/user";
import { generateToken } from "@lib/auth";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";

export async function POST(req) {
  const body = await req.json();
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (!user || !(await bcrypt.compare(parsed.data.password, user.password))) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = generateToken(user);

  const res = NextResponse.json({ token });
  res.cookies.set("token", token, { httpOnly: true, path: "/" });

  return res;
}
