import prisma from "@lib/prisma";
import { NextResponse } from "next/server";
import { permissionsFor, withUser } from "@lib/session";
import {
  ORGANIZATION_PUBLIC_FIELDS,
  serializeOrganization,
} from "@lib/organization";

// The signed-in user, their organization and what their role allows.
export const GET = withUser(async (req, { user }) => {
  const me = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      organization: { select: ORGANIZATION_PUBLIC_FIELDS },
    },
  });

  return NextResponse.json({
    ...me,
    organization: serializeOrganization(me.organization),
    permissions: permissionsFor(me),
  });
});
