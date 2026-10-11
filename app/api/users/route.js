import prisma from "@lib/prisma";
import { NextResponse } from "next/server";
import { withUser } from "@lib/session";

// Everyone in the admin's organization, the admin included.
export const GET = withUser(
  async (req, { user }) => {
    const users = await prisma.user.findMany({
      where: { organizationId: user.organizationId },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(
      users.map((u) => ({ ...u, isYou: u.id === user.id })),
      { status: 200 }
    );
  },
  { can: "manageUsers" }
);
