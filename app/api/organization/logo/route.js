import prisma from "@lib/prisma";
import { NextResponse } from "next/server";
import { withUser } from "@lib/session";
import { parseLogo } from "@lib/organization";

// The organization's logo as an image. The URL carries a version, so it can
// be cached for a long time.
export const GET = withUser(async (req, { user }) => {
  const org = await prisma.organization.findUnique({
    where: { id: user.organizationId },
    select: { logo: true },
  });
  if (!org?.logo) {
    return NextResponse.json({ error: "No logo" }, { status: 404 });
  }

  const { mime, bytes } = parseLogo(org.logo);
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": mime,
      "Cache-Control": "private, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
});
