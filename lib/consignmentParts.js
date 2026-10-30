// Routes for the records a consignment is built from (airway bill, custom
// clearance, packing, recovery, goods declaration). They all follow the same
// pattern: owned by a user, linked from Consignment, and — when they change —
// the ledger of every consignment using them is re-posted.
import { NextResponse } from "next/server";
import prisma from "@lib/prisma";
import { syncConsignmentsWhere } from "@lib/ledger";
import {
  HttpError,
  TX_OPTIONS,
  findOwned,
  ownedBy,
  stamp,
  parseId,
  requireDate,
  requireNumber,
  toDate,
  toNumber,
  vendorOwnedBy,
  withUser,
} from "@lib/session";

// Copies `fields` from body using `read`, skipping absent ones when partial.
function readFields(body, partial, fields) {
  const data = {};
  for (const [field, read] of Object.entries(fields)) {
    if (partial && body[field] === undefined) continue;
    data[field] = read(body[field], field);
  }
  return data;
}

const requiredText = (value, field) => {
  if (typeof value !== "string" || !value.trim()) {
    throw new HttpError(400, `${field} is required`);
  }
  return value.trim();
};

async function ownedVendorRoleId(model, id, user, label) {
  const roleId = Number(id);
  const row =
    Number.isInteger(roleId) &&
    (await prisma[model].findFirst({
      where: { id: roleId, ...vendorOwnedBy(user) },
      select: { id: true },
    }));
  if (!row) throw new HttpError(400, `Invalid ${label}`);
  return roleId;
}

// "usd" -> "USD"; empty -> null.
const optionalCurrency = (value) => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string" || !/^[A-Za-z]{3}$/.test(value.trim())) {
    throw new HttpError(400, "currency must be a 3-letter code");
  }
  return value.trim().toUpperCase();
};

const PARTS = {
  airwayBill: {
    foreignKey: "airwayBillId",
    include: { iataAgent: { include: { vendor: true } } },
    async parse(body, user, partial) {
      const data = readFields(body, partial, {
        number: requiredText,
        dateTime: requireDate,
        rate: requireNumber,
        airwayBillWeight: requireNumber,
        fee: requireNumber,
      });
      // The form sends the whole agent as `iataAgent`; accept a bare id too.
      const agentId = body.iataAgent?.id ?? body.iataAgentId;
      if (agentId !== undefined || !partial) {
        data.iataAgentId = await ownedVendorRoleId("iATAAgent", agentId, user, "IATA agent");
      }
      return data;
    },
  },

  customClearance: {
    foreignKey: "customClearanceId",
    include: { customAgent: { include: { vendor: true } } },
    async parse(body, user, partial) {
      const data = readFields(body, partial, { fee: requireNumber });
      // The form sends the agent as `ca`; accept `customAgent` / an id too.
      const agentId = body.ca?.id ?? body.customAgent?.id ?? body.customAgentId;
      if (agentId !== undefined || !partial) {
        data.customAgentId = await ownedVendorRoleId("customAgent", agentId, user, "custom agent");
      }
      return data;
    },
  },

  packing: {
    foreignKey: "packingId",
    include: { packer: { include: { vendor: true } } },
    async parse(body, user, partial) {
      // totalCost is derived (rate x airway bill weight) when the ledger syncs.
      const data = readFields(body, partial, { ratePerKg: requireNumber });
      const packerId = body.packer?.id ?? body.packerId;
      if (packerId !== undefined || !partial) {
        data.packerId = await ownedVendorRoleId("packer", packerId, user, "packer");
      }
      if (body.totalCost !== undefined) {
        data.totalCost = toNumber(body.totalCost, "totalCost");
      }
      return data;
    },
  },

  recoveryDone: {
    foreignKey: "recoveryDoneId",
    include: undefined,
    async parse(body, user, partial) {
      return readFields(body, partial, {
        amount: requireNumber,
        currency: requiredText,
        exchangeRate: requireNumber,
      });
    },
  },

  goodsDeclaration: {
    foreignKey: "goodsDeclarationId",
    include: undefined,
    async parse(body, user, partial) {
      return readFields(body, partial, {
        number: requiredText,
        date: requireDate,
        exchangeRate: requireNumber,
        commercialInvoiceNumber: requiredText,
        currency: optionalCurrency,
        fob: requireNumber,
        gdFreight: requireNumber,
        r1: toNumber,
        dateR1: toDate,
        r2: toNumber,
        dateR2: toDate,
        r3: toNumber,
        dateR3: toDate,
        r4: toNumber,
        dateR4: toDate,
      });
    },
  },
};

export function consignmentPartCollectionRoutes(model) {
  const { include, parse } = PARTS[model];

  const GET = withUser(async (req, { user }) => {
    const rows = await prisma[model].findMany({
      where: ownedBy(user),
      orderBy: { createdAt: "desc" },
      include,
    });
    return NextResponse.json(rows);
  });

  const POST = withUser(async (req, { user }) => {
    const data = await parse(await req.json(), user, false);
    const created = await prisma[model].create({
      data: { ...data, ...stamp(user) },
      include,
    });
    return NextResponse.json(created);
  });

  return { GET, POST };
}

export function consignmentPartItemRoutes(model) {
  const { include, parse, foreignKey } = PARTS[model];

  const GET = withUser(async (req, { user, params }) => {
    const row = await findOwned(
      prisma[model],
      parseId(params.id),
      ownedBy(user),
      { include }
    );
    return NextResponse.json(row);
  });

  const PUT = withUser(async (req, { user, params }) => {
    const id = parseId(params.id);
    await findOwned(prisma[model], id, ownedBy(user));
    const data = await parse(await req.json(), user, true);

    const updated = await prisma.$transaction(async (tx) => {
      await tx[model].update({ where: { id }, data });
      await syncConsignmentsWhere(tx, { [foreignKey]: id }, user.id);
      return tx[model].findUnique({ where: { id }, include });
    }, TX_OPTIONS);

    return NextResponse.json(updated);
  });

  const DELETE = withUser(async (req, { user, params }) => {
    const id = parseId(params.id);
    await findOwned(prisma[model], id, ownedBy(user));

    await prisma.$transaction(async (tx) => {
      const linked = await tx.consignment.findMany({
        where: { [foreignKey]: id },
        select: { id: true },
      });
      await tx.consignment.updateMany({
        where: { [foreignKey]: id },
        data: { [foreignKey]: null },
      });
      await tx[model].delete({ where: { id } });
      await syncConsignmentsWhere(
        tx,
        { id: { in: linked.map((c) => c.id) } },
        user.id
      );
    }, TX_OPTIONS);

    return NextResponse.json({ success: true });
  }, { can: "delete" });

  return { GET, PUT, DELETE };
}
