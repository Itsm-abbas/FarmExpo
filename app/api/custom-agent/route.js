import prisma from "@lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const customAgent = await prisma.customAgent.findMany({
    include: { vendor: true },
  });
  return NextResponse.json(customAgent);
}

export async function POST(req) {
  const body = await req.json();
  const { name, ntn, address, country, station, balance, currency } = body;

  if (!name || !ntn || !address || !country || !station || !currency) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  try {
    const vendor = await prisma.vendor.create({
      data: { name, ntn, address, country, station, balance, currency },
    });

    const customAgent = await prisma.CustomAgent.create({
      data: { vendorId: vendor.id },
    });

    return NextResponse.json({
      message: "Custom agent created",
      vendorId: vendor.id,
      customAgentId: customAgent.id,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create Custom agent", details: error.message },
      { status: 500 }
    );
  }
}
