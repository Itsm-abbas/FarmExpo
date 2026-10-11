import { NextResponse } from "next/server";
import prisma from "@lib/prisma";
import { ownedBy, stamp, withUser } from "@lib/session";

// GET all
export const GET = withUser(async (req, { user }) => {
  const data = await prisma.packaging.findMany({
    where: ownedBy(user),
    orderBy: { id: "asc" },
  });
  return NextResponse.json(data);
});

// CREATE
export const POST = withUser(async (req, { user }) => {
  const { name, packagingWeightPerUnit } = await req.json();
  if (!name || packagingWeightPerUnit === undefined || packagingWeightPerUnit === "") {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const newItem = await prisma.packaging.create({
    data: {
      name,
      packagingWeightPerUnit: String(packagingWeightPerUnit),
      ...stamp(user),
    },
  });

  return NextResponse.json(newItem);
});
