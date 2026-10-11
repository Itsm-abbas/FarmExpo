import prisma from "@lib/prisma";
import { NextResponse } from "next/server";
import { HttpError, withUser } from "@lib/session";
import {
  ORGANIZATION_PUBLIC_FIELDS,
  organizationData,
  serializeOrganization,
} from "@lib/organization";

export const GET = withUser(async (req, { user }) => {
  const org = await prisma.organization.findUnique({
    where: { id: user.organizationId },
    select: ORGANIZATION_PUBLIC_FIELDS,
  });
  return NextResponse.json(serializeOrganization(org));
});

export const PUT = withUser(
  async (req, { user }) => {
    const data = organizationData(await req.json());
    const current = await prisma.organization.findUnique({
      where: { id: user.organizationId },
      select: { letterheadType: true, letterheadTop: true, letterheadBottom: true },
    });

    const letterheadType =
      data.letterheadType !== undefined ? data.letterheadType : current.letterheadType;
    if (data.useLetterhead && !letterheadType) {
      throw new HttpError(400, "Upload a letterhead before printing on it.");
    }
    const top = data.letterheadTop ?? current.letterheadTop;
    const bottom = data.letterheadBottom ?? current.letterheadBottom;
    if (top + bottom > 200) {
      throw new HttpError(
        400,
        "The top and bottom letterhead margins leave too little room for the invoice."
      );
    }

    const org = await prisma.organization.update({
      where: { id: user.organizationId },
      data,
      select: ORGANIZATION_PUBLIC_FIELDS,
    });
    return NextResponse.json(serializeOrganization(org));
  },
  { can: "manageOrganization" }
);
