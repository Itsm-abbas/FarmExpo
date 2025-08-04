import prisma from "@lib/prisma";
import { commoditySchema } from "@lib/validations/commodity";
import { NextResponse } from "next/server";

export async function GET() {
  const commodities = await prisma.commodity.findMany();
  return NextResponse.json(commodities);
}

export async function POST(req) {
  const body = await req.json();
  const parsed = commoditySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
  }

  try {
    const commodity = await prisma.commodity.create({
      data: parsed.data,
    });
    return NextResponse.json(commodity, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to create commodity" },
      { status: 500 }
    );
  }
}
