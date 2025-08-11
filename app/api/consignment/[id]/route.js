// app/api/consignment/[id]/route.js
import { NextResponse } from "next/server";
import prisma from "@lib/prisma";

// GET single consignment with nested data
export async function GET(_, { params }) {
  try {
    let { id } = await params;
    id = Number(id);

    const consignment = await prisma.consignment.findUnique({
      where: { id },
      include: {
        trader: true,
        consignee: {
          include: {
            vendor: true,
          },
        },

        airwayBill: {
          include: {
            iataAgent: {
              include: { vendor: true },
            },
          },
        },
        goodsDeclaration: true,
        customClearance: {
          include: {
            customAgent: {
              include: { vendor: true },
            },
          },
        },
        packing: {
          include: {
            packer: {
              include: { vendor: true },
            },
          },
        },
        recoveryDone: true,
        goods: {
          include: {
            commodityItem: true,
            packaging: true,
          },
        },
      },
    });

    if (!consignment) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(consignment);
  } catch (err) {
    console.error("GET Consignment error:", err);
    return NextResponse.json(
      { error: "Failed to fetch consignment" },
      { status: 500 }
    );
  }
}

// PUT - Update consignment and nested goods
export async function PUT(req, { params }) {
  try {
    let { id } = await params;
    id = Number(id);
    const body = await req.json();

    // Update consignment main fields
    const updated = await prisma.consignment.update({
      where: { id },
      data: {
        date: new Date(body.date),
        status: body.status,
        localInvoiceWeight: body.localInvoiceWeight,
        dailyExpenses: Number(body.dailyExpenses),
        trader: body.trader?.id
          ? { connect: { id: body.trader.id } }
          : undefined,
        consignee: body.consignee?.id
          ? { connect: { id: body.consignee.id } }
          : undefined,
        airwayBill: body.airwayBill?.id
          ? { connect: { id: body.airwayBill.id } }
          : undefined,
        goodsDeclaration: body.goodsDeclaration?.id
          ? { connect: { id: body.goodsDeclaration.id } }
          : undefined,
        customClearance: body.customClearance?.id
          ? { connect: { id: body.customClearance.id } }
          : undefined,
        packing: body.packing?.id
          ? { connect: { id: body.packing.id } }
          : undefined,
        recoveryDone: body.recoveryDone?.id
          ? { connect: { id: body.recoveryDone.id } }
          : undefined,
      },
    });

    // Delete existing goods
    await prisma.consignmentItem.deleteMany({ where: { consignmentId: id } });

    // Create updated goods
    if (Array.isArray(body.goods)) {
      await prisma.consignmentItem.createMany({
        data: body.goods.map((g) => ({
          consignmentId: id,
          commodityItemId: g.commodityItem.id,
          packagingId: g.packaging.id,
          weightPerUnit: g.weightPerUnit,
          commodityPerUnitCost: g.commodityPerUnitCost,
          packagingPerUnitCost: g.packagingPerUnitCost,
          quantity: g.quantity,
          damage: g.damage,
        })),
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PUT Consignment error:", err);
    return NextResponse.json(
      { error: "Failed to update consignment" },
      { status: 500 }
    );
  }
}

// DELETE - Delete consignment and related items
export async function DELETE(_, { params }) {
  try {
    let { id } = await params;
    id = Number(id);

    // Delete related goods
    await prisma.consignmentItem.deleteMany({ where: { consignmentId: id } });

    // Delete consignment
    await prisma.consignment.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE Consignment error:", err);
    return NextResponse.json(
      { error: "Failed to delete consignment" },
      { status: 500 }
    );
  }
}
