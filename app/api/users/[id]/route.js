import prisma from "@lib/prisma";
import { verifyToken } from "@lib/auth";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
// Get logged-in admin from token
function getAdmin() {
  const token = cookies().get("token")?.value;
  const admin = verifyToken(token);
  return admin && admin.role === "admin" ? admin : null;
}

export async function DELETE(_, { params }) {
  const admin = getAdmin();
  const userId = parseInt(params.id);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (userId === admin.id) {
    return NextResponse.json(
      { error: "You cannot delete your own account." },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || user.createdById !== admin.id) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  await prisma.user.delete({ where: { id: userId } });

  return NextResponse.json({ message: "User deleted" });
}

export async function PUT(req, { params }) {
  const token = cookies().get("token")?.value;
  const admin = verifyToken(token);

  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = parseInt(params.id);

  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user || user.createdById !== admin.id) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 });
  }

  // Prevent self-demotion
  if (userId === admin.id) {
    return NextResponse.json(
      { error: "You cannot change your own role." },
      { status: 400 }
    );
  }

  const newRole = user.role === "admin" ? "user" : "admin";

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role: newRole },
  });

  return NextResponse.json({
    message: newRole === "admin" ? "Promoted to admin" : "Demoted to user",
    user: updated,
  });
}
