import { findUserByEmail } from "@lib/users";
import { loginSchema } from "@lib/validations/user";
import { SESSION_COOKIE, generateToken } from "@lib/auth";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";

export async function POST(req) {
  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please enter a valid email and password." },
      { status: 400 }
    );
  }

  const user = await findUserByEmail(parsed.data.email);

  if (!user || !(await bcrypt.compare(parsed.data.password, user.password))) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = generateToken(user);

  const res = NextResponse.json({ token });
  res.cookies.set("token", token, SESSION_COOKIE);

  return res;
}
