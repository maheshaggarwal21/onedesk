// Money is handled as integer cents everywhere inside One Desk. Floating-point
// dollars drift (0.1 + 0.2 !== 0.3), and drift in a money tool is a bug users can
// see. Inputs come in as decimal dollars and are converted to cents at the edge
// (model.js); everything downstream is integers; only formatting converts back.

// Dollars (number) -> integer cents. Rounds to the nearest cent.
export function toCents(dollars) {
  return Math.round(Number(dollars) * 100);
}

// Integer cents -> dollars (number). For interchange/JSON, not for math.
export function toDollars(cents) {
  return cents / 100;
}

// Integer cents -> display string, e.g. 123456 -> "$1,234.56", -50 -> "-$0.50".
export function fmtCents(cents) {
  const n = Math.round(Number(cents) || 0);
  const neg = n < 0;
  const abs = Math.abs(n);
  const dollars = Math.floor(abs / 100);
  const rem = String(abs % 100).padStart(2, '0');
  return `${neg ? '-' : ''}$${dollars.toLocaleString('en-US')}.${rem}`;
}

// A tax rate can arrive as a fraction (0.25) or a percentage (25). Anything > 1 is
// read as a percentage. Clamped to [0, 1]; garbage becomes 0 (a safe default that
// never over-reserves on nonsense).
export function normalizeRate(rate) {
  let r = Number(rate);
  if (!Number.isFinite(r) || r < 0) return 0;
  if (r > 1) r = r / 100;
  return Math.min(r, 1);
}
