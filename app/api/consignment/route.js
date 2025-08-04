import { NextResponse } from "next/server";
import prisma from "@lib/prisma";

export async function POST(req) {
  try {
    const body = await req.json();
    console.log("Creating consignment with body:", body);
    const created = await prisma.consignment.create({
      data: {
        date: new Date(body.date),
        status: body.status,
        localInvoiceWeight: body.localInvoiceWeight,
        dailyExpenses: body.dailyExpenses,
        trader: body.trader?.id
          ? { connect: { id: body.trader.id } }
          : undefined,
        consignee: body.consignee?.vendorId
          ? { connect: { vendorId: body.consignee.vendorId } }
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
        goods: {
          create: body.goods?.map((g) => ({
            commodityItem: { connect: { id: g.commodityItem.id } },
            packaging: { connect: { id: g.packaging.id } },
            weightPerUnit: g.weightPerUnit,
            commodityPerUnitCost: g.commodityPerUnitCost,
            packagingPerUnitCost: g.packagingPerUnitCost,
            quantity: g.quantity,
            damage: g.damage,
          })),
        },
      },
      include: {
        trader: true,
        consignee: true,
        airwayBill: true,
        goodsDeclaration: true,
        customClearance: true,
        packing: true,
        recoveryDone: true,
        goods: {
          include: {
            commodityItem: true,
            packaging: true,
          },
        },
      },
    });

    return NextResponse.json(created);
  } catch (err) {
    console.error("Error creating consignment:", err);
    return NextResponse.json(
      { error: "Failed to create consignment" },
      { status: 500 }
    );
  }
}
// export async function POST(req) {
//   try {
//     const {
//       traderId,
//       consigneeId,
//       airwayBillId,
//       goodsDeclarationId,
//       customClearanceId,
//       packingId,
//       recoveryDoneId,
//       localInvoiceWeight,
//       dailyExpenses,
//       status,
//       date,
//     } = await req.json();

//     const consignment = await prisma.consignment.create({
//       data: {
//         traderId,
//         consigneeId,
//         airwayBillId,
//         goodsDeclarationId,
//         customClearanceId,
//         packingId,
//         recoveryDoneId,
//         localInvoiceWeight,
//         dailyExpenses,
//         status,
//         date: new Date(date),
//       },
//       include: {
//         trader: true,
//         consignee: {
//           include: { vendor: true },
//         },
//         airwayBill: {
//           include: { iataAgent: { include: { vendor: true } } },
//         },
//         goodsDeclaration: true,
//         customClearance: {
//           include: { customAgent: { include: { vendor: true } } },
//         },
//         packing: {
//           include: { packer: { include: { vendor: true } } },
//         },
//         recoveryDone: true,
//         goods: {
//           include: {
//             commodityItem: true,
//             packaging: true,
//           },
//         },
//       },
//     });

//     return NextResponse.json(consignment);
//   } catch (error) {
//     console.error(error);
//     return NextResponse.json(
//       { error: "Failed to create consignment" },
//       { status: 500 }
//     );
//   }
// }

export async function GET() {
  const consignments = await prisma.consignment.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      trader: true,
      consignee: {
        include: { vendor: true },
      },
      airwayBill: {
        include: { iataAgent: { include: { vendor: true } } },
      },
      goodsDeclaration: true,
      customClearance: {
        include: { customAgent: { include: { vendor: true } } },
      },
      packing: {
        include: { packer: { include: { vendor: true } } },
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

  return NextResponse.json(consignments);
}
