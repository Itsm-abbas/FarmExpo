// app/api/consignee/route.js

import prisma from "@lib/prisma";
import { NextResponse } from "next/server";
export async function GET() {
  const consignee = await prisma.consignee.findMany({
    include: { vendor: true },
  });
  return NextResponse.json(consignee);
}
export async function POST(req) {
  const body = await req.json();
  const { name, ntn, address, country, station, balance, currency } = body;

  try {
    const vendor = await prisma.vendor.create({
      data: { name, ntn, address, country, station, balance, currency },
    });

    const consignee = await prisma.consignee.create({
      data: { vendorId: vendor.id },
    });

    return NextResponse.json({
      message: "Consignee created",
      vendorId: vendor.id,
      consigneeId: consignee.id,
    });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Failed to create consignee" },
      { status: 500 }
    );
  }
}
