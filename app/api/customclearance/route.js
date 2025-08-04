import { NextResponse } from "next/server";
import prisma from "@lib/prisma";

export async function POST(req) {
  try {
    const { ca, fee } = await req.json();
    // console.log("Request body:", await req.json());

    const clearance = await prisma.customClearance.create({
      data: {
        customAgentId: ca.id,
        fee: parseFloat(fee),
      },
      include: { customAgent: true },
    });

    return NextResponse.json(clearance);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create clearance" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const all = await prisma.customClearance.findMany({
    include: { customAgent: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(all);
}
