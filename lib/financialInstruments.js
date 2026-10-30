import prisma from "@lib/prisma";
import {
  HttpError,
  ownedBy,
  toDate,
  toNumber,
  vendorOwnedBy,
} from "@lib/session";

const text = (value) =>
  typeof value === "string" && value.trim() ? value.trim() : null;

// Whitelists and validates a financial instrument body. The trader and
// consignee, when given, must belong to the user.
export async function financialInstrumentData(body, user) {
  if (!text(body.number)) throw new HttpError(400, "number is required");
  if (!text(body.bankName)) throw new HttpError(400, "Enter the bank name");

  const traderId = toNumber(body.traderId, "trader");
  if (
    traderId !== null &&
    !(await prisma.trader.findFirst({ where: { id: traderId, ...ownedBy(user) } }))
  ) {
    throw new HttpError(400, "Invalid trader");
  }

  const consigneeId = toNumber(body.consigneeId, "consignee");
  if (
    consigneeId !== null &&
    !(await prisma.consignee.findFirst({
      where: { id: consigneeId, ...vendorOwnedBy(user) },
    }))
  ) {
    throw new HttpError(400, "Invalid consignee");
  }

  return {
    number: text(body.number),
    traderId,
    consigneeId,
    bankName: text(body.bankName),
    mode: text(body.mode),
    deliveryTerm: text(body.deliveryTerm),
    currency: text(body.currency),
    localDate: toDate(body.localDate, "localDate"),
    expiryDate: toDate(body.expiryDate, "expiryDate"),
    status: text(body.status),
    amount: toNumber(body.amount, "amount") ?? 0,
    balance: toNumber(body.balance, "balance") ?? 0,
    iban: text(body.iban),
  };
}

// Creates (existing = null) or updates a financial instrument utilization,
// keeping the instruments' balances right — including when the utilization
// is moved to a different instrument.
export async function saveUtilization(body, user, existing) {
  const fiId = Number(
    body.financialInstrument?.id ??
      body.financialInstrumentId ??
      existing?.financialInstrumentId
  );
  const gdId = Number(
    body.goodsDeclaration?.id ??
      body.goodsDeclarationId ??
      existing?.goodsDeclarationId
  );
  const utilized = toNumber(body.utilized, "utilized");
  if (!fiId || !gdId || !utilized || utilized <= 0) {
    throw new HttpError(400, "Missing fields");
  }

  const goodsDeclaration = await prisma.goodsDeclaration.findFirst({
    where: { id: gdId, ...ownedBy(user) },
  });
  if (!goodsDeclaration) throw new HttpError(400, "Invalid goods declaration");

  return prisma.$transaction(async (tx) => {
    if (existing) {
      await tx.financialInstrument.update({
        where: { id: existing.financialInstrumentId },
        data: { balance: { increment: existing.utilized } },
      });
    }

    const fi = await tx.financialInstrument.findFirst({
      where: { id: fiId, ...ownedBy(user) },
    });
    if (!fi) throw new HttpError(404, "Financial Instrument not found");
    if (fi.balance - utilized < 0) {
      throw new HttpError(400, "Insufficient balance");
    }

    await tx.financialInstrument.update({
      where: { id: fiId },
      data: { balance: fi.balance - utilized },
    });

    const data = {
      financialInstrumentId: fiId,
      goodsDeclarationId: gdId,
      utilized,
    };
    return existing
      ? tx.financialInstrumentUtilization.update({
          where: { id: existing.id },
          data,
        })
      : tx.financialInstrumentUtilization.create({ data });
  });
}

// Replaces the financial instruments a consignment uses with `list`
// ([{ financialInstrumentId, utilized }]): what was used before is given back
// to its instrument, then each new amount is taken from its instrument, which
// must have enough balance left.
export async function setConsignmentInstruments(tx, consignmentId, list, user) {
  if (!Array.isArray(list)) throw new HttpError(400, "instruments must be a list");
  const rows = list.map((row, i) => {
    const financialInstrumentId = Number(row?.financialInstrumentId ?? row?.financialInstrument?.id);
    const utilized = toNumber(row?.utilized, "utilized");
    if (!Number.isInteger(financialInstrumentId)) {
      throw new HttpError(400, `Instrument ${i + 1}: choose a financial instrument`);
    }
    if (!(utilized > 0)) {
      throw new HttpError(400, `Instrument ${i + 1}: enter an amount more than 0`);
    }
    return { financialInstrumentId, utilized: Math.round(utilized * 100) / 100 };
  });
  const ids = rows.map((r) => r.financialInstrumentId);
  if (new Set(ids).size !== ids.length) {
    throw new HttpError(400, "Each financial instrument can be added once");
  }

  const existing = await tx.financialInstrumentUtilization.findMany({
    where: { consignmentId },
  });
  // Lock every instrument involved (in id order) so two saves can't both
  // spend the same balance.
  const touched = [...new Set([...ids, ...existing.map((u) => u.financialInstrumentId)])].sort(
    (a, b) => a - b
  );
  if (touched.length) {
    await tx.$queryRaw`SELECT id FROM "FinancialInstrument" WHERE id = ANY(${touched}) ORDER BY id FOR UPDATE`;
  }

  for (const u of existing) {
    await tx.financialInstrument.update({
      where: { id: u.financialInstrumentId },
      data: { balance: { increment: u.utilized } },
    });
  }
  await tx.financialInstrumentUtilization.deleteMany({ where: { consignmentId } });

  for (const row of rows) {
    const fi = await tx.financialInstrument.findFirst({
      where: { id: row.financialInstrumentId, ...ownedBy(user) },
    });
    if (!fi) throw new HttpError(400, "Choose a valid financial instrument");
    if (fi.balance - row.utilized < -0.000001) {
      const left = [fi.currency, fi.balance.toLocaleString("en-US")].filter(Boolean).join(" ");
      throw new HttpError(400, `Financial instrument ${fi.number} has only ${left} left`);
    }
    await tx.financialInstrument.update({
      where: { id: fi.id },
      data: { balance: Math.round((fi.balance - row.utilized) * 100) / 100 },
    });
    await tx.financialInstrumentUtilization.create({
      data: { financialInstrumentId: fi.id, consignmentId, utilized: row.utilized },
    });
  }
}

// Gives a consignment's utilized amounts back to their instruments and
// removes the utilizations (when the consignment is deleted).
export async function releaseConsignmentInstruments(tx, consignmentId) {
  const existing = await tx.financialInstrumentUtilization.findMany({
    where: { consignmentId },
  });
  for (const u of existing) {
    await tx.financialInstrument.update({
      where: { id: u.financialInstrumentId },
      data: { balance: { increment: u.utilized } },
    });
  }
  await tx.financialInstrumentUtilization.deleteMany({ where: { consignmentId } });
}
