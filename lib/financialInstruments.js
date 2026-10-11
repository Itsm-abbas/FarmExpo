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
