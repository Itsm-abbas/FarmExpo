import prisma from "@lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const iataAgents = await prisma.IATAAgent.findMany({
    include: { vendor: true },
  });
  return NextResponse.json(iataAgents);
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

    const iataAgent = await prisma.IATAAgent.create({
      data: { vendorId: vendor.id },
    });

    return NextResponse.json({
      message: "IATA agent created",
      vendorId: vendor.id,
      iataAgentId: iataAgent.id,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create IATA agent", details: error.message },
      { status: 500 }
    );
  }
}
