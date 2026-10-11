import prisma from "@lib/prisma";
import { NextResponse } from "next/server";
import { TX_OPTIONS, withUser } from "@lib/session";
import { findMember } from "@lib/users";

// Records stay with the organization; only the user account is removed.
export const DELETE = withUser(
  async (req, { user: admin, params }) => {
    const user = await findMember(admin, params.id);

    await prisma.$transaction(async (tx) => {
      await tx.user.updateMany({
        where: { createdById: user.id },
        data: { createdById: admin.id },
      });
      await tx.user.delete({ where: { id: user.id } });
    }, TX_OPTIONS);

    return NextResponse.json({ message: "User removed" });
  },
  { can: "manageUsers" }
);

export const PUT = withUser(
  async (req, { user: admin, params }) => {
    const user = await findMember(admin, params.id);

    const requested = new URL(req.url).searchParams.get("role");
    const newRole = ["admin", "user"].includes(requested)
      ? requested
      : user.role === "admin"
      ? "user"
      : "admin";

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { role: newRole },
      select: { id: true, email: true, name: true, role: true },
    });

    return NextResponse.json({
      message: newRole === "admin" ? "Made admin" : "Made staff",
      user: updated,
    });
  },
  { can: "manageUsers" }
);
