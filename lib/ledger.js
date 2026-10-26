// Vendor ledger maintenance.
//
// A vendor's balance is always openingBalance + credits - debits, and every
// transaction's balanceAfter is the running total in (createdAt, id) order.
// Both are recomputed from scratch after any change, so editing or deleting an
// old entry never leaves later balances stale.
//
// Consignment costs are posted to the ledger here, on the server, whenever a
// consignment or one of its parts changes — the client never posts them itself.

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

// One statement (one round trip to the database): rewrites the running
// balances that changed, then the vendor's balance.
export async function recomputeVendorBalance(db, vendorId) {
  // Saves to the same vendor take turns: this waits for any other open save
  // to finish, so the totals below include its entries. (Without it, two
  // simultaneous saves each miss the other's entry.)
  await db.$queryRaw`SELECT id FROM "Vendor" WHERE id = ${vendorId} FOR NO KEY UPDATE`;
  const rows = await db.$queryRaw`
    WITH opening AS (
      SELECT COALESCE("openingBalance", 0) AS amount FROM "Vendor" WHERE id = ${vendorId}
    ),
    running AS (
      SELECT t.id,
        ROUND(((SELECT amount FROM opening) + SUM(
          CASE WHEN t."type" = 'debit' THEN -t."amount" ELSE t."amount" END
        ) OVER (ORDER BY t."createdAt", t.id))::numeric, 2)::double precision AS balance
      FROM "Transaction" AS t
      WHERE t."vendorId" = ${vendorId}
    ),
    rewritten AS (
      UPDATE "Transaction" AS t
      SET "balanceAfter" = running.balance
      FROM running
      WHERE t.id = running.id AND t."balanceAfter" IS DISTINCT FROM running.balance
    )
    UPDATE "Vendor" AS v
    SET balance = ROUND((COALESCE(v."openingBalance", 0) + COALESCE((
      SELECT SUM(CASE WHEN t."type" = 'debit' THEN -t."amount" ELSE t."amount" END)
      FROM "Transaction" AS t
      WHERE t."vendorId" = ${vendorId}
    ), 0))::numeric, 2)::double precision
    WHERE v.id = ${vendorId}
    RETURNING v.balance`;
  return rows[0] ? rows[0].balance : null;
}

export const CONSIGNMENT_SOURCES = [
  "airwayBill",
  "customClearance",
  "packing",
  "consignee",
  "recovery",
];

const SOURCE_TXN_PREFIX = {
  airwayBill: "AWB",
  customClearance: "CUSTOM",
  packing: "PACK",
  consignee: "INV",
  recovery: "REC",
};

const CONSIGNMENT_LEDGER_INCLUDE = {
  consignee: { include: { vendor: true } },
  airwayBill: { include: { iataAgent: true } },
  customClearance: { include: { customAgent: true } },
  packing: { include: { packer: true } },
  recoveryDone: true,
};

export function packingTotal(consignment) {
  const weight = consignment.airwayBill?.airwayBillWeight || 0;
  return round2((consignment.packing?.ratePerKg || 0) * weight);
}

const code = (currency) => (currency || "").trim().toUpperCase();

// A recovery's amount in the currency of the consignee's ledger, or null if
// it can't be converted. The recovery's exchange rate converts its currency
// to the organization's base currency (as on the invoice), so it only applies
// when the ledger is kept in the base currency.
export function recoveryInLedgerCurrency(recovery, ledgerCurrency, baseCurrency) {
  const from = code(recovery.currency);
  const to = code(ledgerCurrency);
  if (!to || !from || from === to) return round2(recovery.amount);
  if (to === code(baseCurrency)) return round2(recovery.amount * recovery.exchangeRate);
  return null;
}

// What each vendor should be charged (credit) or paid (debit) for a consignment.
// The formulas match the invoice page.
export function consignmentLedgerEntries(c, baseCurrency) {
  const entries = [];
  const awb = c.airwayBill;

  if (awb?.iataAgent) {
    entries.push({
      source: "airwayBill",
      vendorId: awb.iataAgent.vendorId,
      type: "credit",
      amount: round2(awb.rate * awb.airwayBillWeight + awb.fee),
      details: `Airway bill ${awb.number} for consignment #${c.id}: ${awb.airwayBillWeight} kg x ${awb.rate} + fee ${awb.fee}`,
    });
  }

  if (c.customClearance?.customAgent) {
    entries.push({
      source: "customClearance",
      vendorId: c.customClearance.customAgent.vendorId,
      type: "credit",
      amount: round2(c.customClearance.fee),
      details: `Custom clearance fee for consignment #${c.id}`,
    });
  }

  if (c.packing?.packer) {
    const weight = awb?.airwayBillWeight || 0;
    entries.push({
      source: "packing",
      vendorId: c.packing.packer.vendorId,
      type: "credit",
      amount: packingTotal(c),
      details: `Packing for consignment #${c.id}: ${weight} kg x ${c.packing.ratePerKg}/kg`,
    });
  }

  if (c.consignee && c.consigneeAmount) {
    entries.push({
      source: "consignee",
      vendorId: c.consignee.vendorId,
      type: "credit",
      amount: round2(c.consigneeAmount),
      details: `Invoice amount for consignment #${c.id}`,
    });
  }

  if (c.consignee && c.recoveryDone) {
    const amount = recoveryInLedgerCurrency(
      c.recoveryDone,
      c.consignee.vendor?.currency,
      baseCurrency
    );
    // A recovery in a third currency can't be converted reliably, so it is
    // not posted (the recovery form warns about this).
    if (amount !== null) {
      const rec = c.recoveryDone;
      const converted = amount !== round2(rec.amount);
      entries.push({
        source: "recovery",
        vendorId: c.consignee.vendorId,
        type: "debit",
        amount,
        details: converted
          ? `Recovery for consignment #${c.id}: ${rec.currency} ${rec.amount} @ ${rec.exchangeRate}`
          : `Recovery for consignment #${c.id}`,
      });
    }
  }

  return entries.filter((e) => e.amount > 0);
}

// Brings the ledger entries posted for one consignment in line with its
// current airway bill, custom clearance, packing, consignee amount and recovery.
export async function syncConsignmentLedger(db, consignmentId, userId) {
  const c = await db.consignment.findUnique({
    where: { id: consignmentId },
    include: CONSIGNMENT_LEDGER_INCLUDE,
  });
  if (!c) return;

  if (c.packing && c.packing.totalCost !== packingTotal(c)) {
    await db.packing.update({
      where: { id: c.packing.id },
      data: { totalCost: packingTotal(c) },
    });
  }

  const organization = c.organizationId
    ? await db.organization.findUnique({
        where: { id: c.organizationId },
        select: { baseCurrency: true },
      })
    : null;
  const wanted = consignmentLedgerEntries(c, organization?.baseCurrency || "PKR");
  const existing = await db.transaction.findMany({
    where: { consignmentId, source: { not: null } },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
  const touchedVendors = new Set();

  for (const source of CONSIGNMENT_SOURCES) {
    const want = wanted.find((e) => e.source === source);
    const [current, ...duplicates] = existing.filter(
      (t) => t.source === source
    );

    for (const dup of duplicates) {
      await db.transaction.delete({ where: { id: dup.id } });
      touchedVendors.add(dup.vendorId);
    }

    if (!want) {
      if (current) {
        await db.transaction.delete({ where: { id: current.id } });
        touchedVendors.add(current.vendorId);
      }
      continue;
    }

    if (!current) {
      await db.transaction.create({
        data: {
          vendorId: want.vendorId,
          consignmentId,
          source,
          type: want.type,
          amount: want.amount,
          details: want.details,
          transactionId: `${SOURCE_TXN_PREFIX[source]}-${consignmentId}`,
          voucherId: `CONS-${consignmentId}`,
          createdBy: userId ?? null,
          balanceAfter: 0, // set by recomputeVendorBalance below
        },
      });
      touchedVendors.add(want.vendorId);
      continue;
    }

    if (
      current.vendorId !== want.vendorId ||
      current.type !== want.type ||
      current.amount !== want.amount ||
      current.details !== want.details
    ) {
      await db.transaction.update({
        where: { id: current.id },
        data: {
          vendorId: want.vendorId,
          type: want.type,
          amount: want.amount,
          details: want.details,
        },
      });
      touchedVendors.add(current.vendorId);
      touchedVendors.add(want.vendorId);
    }
  }

  // Same order everywhere, so saves touching several vendors never deadlock.
  for (const vendorId of [...touchedVendors].sort((a, b) => a - b)) {
    await recomputeVendorBalance(db, vendorId);
  }
}

// Re-syncs every consignment that uses a given airway bill / clearance / etc.
export async function syncConsignmentsWhere(db, where, userId) {
  const consignments = await db.consignment.findMany({
    where,
    select: { id: true },
  });
  for (const { id } of consignments) {
    await syncConsignmentLedger(db, id, userId);
  }
}

// Removes the entries a consignment posted and fixes the affected balances.
export async function removeConsignmentLedger(db, consignmentId) {
  const posted = await db.transaction.findMany({
    where: { consignmentId },
    select: { id: true, vendorId: true, source: true },
  });
  const vendorIds = new Set(posted.map((t) => t.vendorId));

  await db.transaction.deleteMany({
    where: { consignmentId, source: { not: null } },
  });
  // Manual entries that merely reference the consignment are kept, unlinked.
  await db.transaction.updateMany({
    where: { consignmentId },
    data: { consignmentId: null },
  });

  for (const vendorId of [...vendorIds].sort((a, b) => a - b)) {
    await recomputeVendorBalance(db, vendorId);
  }
}
