// app/api/trader/route.js
import prisma from "../../../lib/prisma";
import { traderSchema } from "../../../lib/validations/trader";
import { NextResponse } from "next/server";

export async function GET() {
  const traders = await prisma.trader.findMany();
  return NextResponse.json(traders);
}

export async function POST(req) {
  const body = await req.json();
  const parsed = traderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
  }

  try {
    const trader = await prisma.trader.create({
      data: parsed.data,
    });
    return NextResponse.json(trader, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to create trader" },
      { status: 500 }
    );
  }
}
