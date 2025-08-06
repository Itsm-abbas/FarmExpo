import { NextResponse } from "next/server";
import prisma from "@lib/prisma";
import { verifyToken } from "@lib/auth";

export async function PUT(req) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  const user = verifyToken(token);

  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      name: body.name,
      email: body.email,
      ...(body.password && { password: body.password }), // ⚠️ Hash in production!
    },
  });

  return NextResponse.json({ message: "Profile updated", user: updated });
}
