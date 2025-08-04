import prisma from "@lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const packers = await prisma.packer.findMany({
    include: { vendor: true },
  });
  return NextResponse.json(packers);
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

    const packer = await prisma.packer.create({
      data: { vendorId: vendor.id },
    });

    return NextResponse.json({
      message: "Packer created",
      vendorId: vendor.id,
      packerId: packer.id,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create packer", details: error.message },
      { status: 500 }
    );
  }
}
