import prisma from "@lib/prisma";
import { requireAdminFromRequest } from "@lib/authMiddleware";
import { NextResponse } from "next/server";

export async function GET(req) {
  const token = req.cookies.get("token")?.value;
  const admin = requireAdminFromRequest(req);

  const user = token ? verifyToken(token) : null;

  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    where: { createdById: admin.id },
    select: { id: true, email: true, name: true, role: true },
  });

  return NextResponse.json(users);
}
