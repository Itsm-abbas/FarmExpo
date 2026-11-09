import prisma from "@lib/prisma";
import { NextResponse } from "next/server";
import { withUser } from "@lib/session";
import { parseSignature } from "@lib/organization";

// The signature printed on invoices, as an image. The URL carries a version,
// so it can be cached for a long time.
export const GET = withUser(async (req, { user }) => {
  const org = await prisma.organization.findUnique({
    where: { id: user.organizationId },
    select: { signature: true },
  });
  if (!org?.signature) {
    return NextResponse.json({ error: "No signature" }, { status: 404 });
  }

  const { mime, bytes } = parseSignature(org.signature);
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": mime,
      "Cache-Control": "private, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
});
