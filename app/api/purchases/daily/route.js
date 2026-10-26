// Daily price list: purchases per day and commodity, with the average cost per
// kg (total amount / total kg), the lowest and highest rate, and who we bought from.
import { NextResponse } from "next/server";
import prisma from "@lib/prisma";
import { PURCHASE_INCLUDE, dailyPrices, dateRange } from "@lib/purchases";
import { ownedBy, parseId, withUser } from "@lib/session";

// ?from, ?to (YYYY-MM-DD, inclusive), ?commodityId
export const GET = withUser(async (req, { user }) => {
  const params = new URL(req.url).searchParams;
  const where = { ...ownedBy(user) };
  const date = dateRange(params);
  if (date) where.date = date;
  if (params.get("commodityId")) where.commodityId = parseId(params.get("commodityId"));

  const purchases = await prisma.purchase.findMany({
    where,
    include: PURCHASE_INCLUDE,
    orderBy: [{ date: "desc" }, { id: "asc" }],
  });
  return NextResponse.json(dailyPrices(purchases));
});
