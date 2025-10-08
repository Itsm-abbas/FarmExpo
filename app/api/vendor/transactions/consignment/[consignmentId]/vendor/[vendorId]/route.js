// app/api/vendor/transactions/consignment/[consignmentId]/vendor/[vendorId]/route.js
import prisma from "@lib/prisma";
import { NextResponse } from "next/server";

export async function GET(_, { params }) {
  let { consignmentId, vendorId } = await params;
  consignmentId = Number(consignmentId);
  vendorId = Number(vendorId);
  console.log("Fetching transaction for:", consignmentId, vendorId);
  try {
    const transaction = await prisma.transaction.findFirst({
      where: {
        consignmentId: consignmentId,
        vendorId: vendorId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(transaction);
  } catch (error) {
    console.error("Error fetching transaction:", error);
    return NextResponse.json(
      { error: "Failed to fetch transaction" },
      { status: 500 }
    );
  }
}
