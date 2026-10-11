import prisma from "@lib/prisma";
import { NextResponse } from "next/server";
import { withUser } from "@lib/session";
import { parseLetterhead } from "@lib/organization";

// The organization's letterhead (PNG, JPEG or PDF), used when generating
// invoice and statement PDFs. The URL carries a version, so it caches well.
export const GET = withUser(async (req, { user }) => {
  const org = await prisma.organization.findUnique({
    where: { id: user.organizationId },
    select: { letterhead: true },
  });
  if (!org?.letterhead) {
    return NextResponse.json({ error: "No letterhead" }, { status: 404 });
  }

  const { mime, bytes } = parseLetterhead(org.letterhead);
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": mime,
      // A PDF is downloaded rather than opened on this site.
      "Content-Disposition":
        mime === "application/pdf"
          ? 'attachment; filename="letterhead.pdf"'
          : "inline",
      "Cache-Control": "private, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
});
