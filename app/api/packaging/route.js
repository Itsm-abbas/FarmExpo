import { NextResponse } from "next/server";
import prisma from "@lib/prisma";

// GET all
export async function GET() {
  const data = await prisma.packaging.findMany();
  return NextResponse.json(data);
}

// CREATE
export async function POST(req) {
  try {
    const body = await req.json();
    const { name, packagingWeightPerUnit } = body;

    if (!name || !packagingWeightPerUnit) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const newItem = await prisma.packaging.create({
      data: { name, packagingWeightPerUnit },
    });

    return NextResponse.json(newItem);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create packaging" },
      { status: 500 }
    );
  }
}
