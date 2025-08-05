import prisma from "@lib/prisma";
import { requireAdminFromRequest } from "@lib/authMiddleware";
import { NextResponse } from "next/server";
import { verifyToken } from "@lib/auth";

export async function GET(req) {
  const token = req.cookies.get("token")?.value;
  // const admin = requireAdminFromRequest();
  const user = verifyToken(token);
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    where: { createdById: user.id },
    select: { id: true, email: true, name: true, role: true },
  });

  return NextResponse.json(users, { status: 200 });
}
