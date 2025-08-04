import { NextResponse } from "next/server";
import prisma from "@lib/prisma";

export async function GET(req, { params }) {
  let { id } = await params;
  id = Number(id);
  const consignment = await prisma.consignment.findUnique({
    where: { id },
    include: {
      trader: true,
      consignee: { include: { vendor: true } },
      airwayBill: { include: { iataAgent: { include: { vendor: true } } } },
      goodsDeclaration: true,
      customClearance: {
        include: { customAgent: { include: { vendor: true } } },
      },
      goods: { include: { commodityItem: true, packaging: true } },
      packing: { include: { packer: { include: { vendor: true } } } },
      recoveryDone: true,
    },
  });

  return Response.json(consignment);
}

export async function PUT(req, { params }) {
  let { id } = params;
  id = Number(id);
  try {
    const {
      commodityItem,
      packaging,
      weightPerUnit,
      packagingPerUnitCost,
      commodityPerUnitCost,
      quantity,
      damage,
      consignmentId,
    } = await req.json();

    const updated = await prisma.consignmentItem.update({
      where: { id },
      data: {
        commodityItemId: commodityItem.id,
        packagingId: packaging.id,
        consignmentId: Number(consignmentId),
        weightPerUnit: parseFloat(weightPerUnit),
        packagingPerUnitCost: parseFloat(packagingPerUnitCost),
        commodityPerUnitCost: parseFloat(commodityPerUnitCost),
        quantity,
        damage,
      },
      include: {
        commodityItem: true,
        packaging: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Consignment item update error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
export async function DELETE(_, { params }) {
  let { id } = await params;
  id = Number(id);
  await prisma.consignmentItem.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
