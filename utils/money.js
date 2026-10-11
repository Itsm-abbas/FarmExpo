// "PKR 1,250.5" — amounts always shown with their currency.
export function formatMoney(amount, currency, { decimals } = {}) {
  if (amount === null || amount === undefined || amount === "") return "—";
  const n = Number(amount);
  if (!Number.isFinite(n)) return "—";
  const number = n.toLocaleString("en-US", {
    minimumFractionDigits: decimals ?? 0,
    maximumFractionDigits: decimals ?? 2,
  });
  return currency ? `${currency} ${number}` : number;
}

// Field label with its currency, e.g. "Fee (PKR)".
export const withCurrency = (label, currency) =>
  currency ? `${label} (${currency})` : label;
