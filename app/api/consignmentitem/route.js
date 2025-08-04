import { NextResponse } from "next/server";
import prisma from "@lib/prisma";

export async function POST(req) {
  try {
    // console.log(await req.json());
    const {
      commodityItem, // expects { id: number }
      packaging, // expects { id: number }
      quantity,
      weightPerUnit,
      commodityPerUnitCost,
      packagingPerUnitCost,
      damage,
      consignmentId, // ✅ this must be passed explicitly
    } = await req.json();
    console.log();
    if (!commodityItem?.id || !packaging?.id || !consignmentId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const savedItem = await prisma.consignmentItem.create({
      data: {
        commodityItemId: commodityItem.id,
        packagingId: packaging.id,
        consignmentId: Number(consignmentId),
        quantity,
        weightPerUnit,
        commodityPerUnitCost,
        packagingPerUnitCost,
        damage,
      },
      include: {
        commodityItem: true,
        packaging: true,
      },
    });

    return NextResponse.json(savedItem);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create item" },
      { status: 500 }
    );
  }
}
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const consignmentId = searchParams.get("consignmentId");

    const whereClause = consignmentId
      ? { consignmentId: Number(consignmentId) }
      : {};

    const items = await prisma.consignmentItem.findMany({
      where: whereClause,
      include: {
        commodityItem: true,
        packaging: true,
      },
      orderBy: { id: "desc" },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("GET Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch consignment items" },
      { status: 500 }
    );
  }
}
