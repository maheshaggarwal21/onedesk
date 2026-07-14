// The advisor. Pure function over a normalized dataset -> a verdict object with the
// three headline answers and the numbers behind them. No I/O, no dates-from-the-clock,
// no randomness: same dataset in, same verdict out, so it is fully testable.
//
// Definitions (stated plainly, because hidden assumptions in money advice are a trap):
//   business profit   = business income - business expenses over the period
//   tax to set aside  = taxRate * max(0, business profit)   [tax is on profit, not gross]
//   business cash     = opening business balance + net business flow
//   available cash    = business cash - tax to set aside     [tax isn't yours to spend]
//   monthly burn      = business expenses / months in the period
//   buffer            = monthly burn * bufferMonths          [a safety cushion you keep]
//   safe to pay self  = max(0, available cash - buffer)      [the honest drawable surplus]
//   runway            = available cash / monthly burn        [months you can survive]
// Unclassified transactions are excluded and reported, never folded in silently.

import { groupByScope } from './split.js';

function moneyIn(txns) {
  return txns.reduce((s, t) => (t.cents > 0 ? s + t.cents : s), 0);
}
function moneyOut(txns) {
  // returned as a positive magnitude of expenses
  return txns.reduce((s, t) => (t.cents < 0 ? s - t.cents : s), 0);
}
function net(txns) {
  return txns.reduce((s, t) => s + t.cents, 0);
}

// Inclusive whole-month span between the earliest and latest transaction, min 1.
export function periodMonths(txns) {
  if (txns.length === 0) return 1;
  let min = txns[0].date;
  let max = txns[0].date;
  for (const t of txns) {
    if (t.date < min) min = t.date;
    if (t.date > max) max = t.date;
  }
  const [ay, am] = min.split('-').map(Number);
  const [by, bm] = max.split('-').map(Number);
  return { months: Math.max(1, (by - ay) * 12 + (bm - am) + 1), from: min, to: max };
}

export function analyze(dataset) {
  const { txns, taxRate, bufferMonths, opening } = dataset;
  const g = groupByScope(txns);

  const bizIncome = moneyIn(g.business);
  const bizExpense = moneyOut(g.business);
  const bizProfit = bizIncome - bizExpense;
  const bizCash = opening.business + net(g.business);

  const perIncome = moneyIn(g.personal);
  const perExpense = moneyOut(g.personal);

  const span = txns.length ? periodMonths(txns) : { months: 1, from: dataset.asOf, to: dataset.asOf };

  const taxOwed = Math.max(0, Math.round(bizProfit * taxRate));
  const availableCash = bizCash - taxOwed;
  const monthlyBurn = span.months > 0 ? Math.round(bizExpense / span.months) : 0;
  const buffer = monthlyBurn * bufferMonths;
  const safeToPayYourself = Math.max(0, availableCash - buffer);

  // runway: months of survival on available (post-tax) cash at current burn.
  // null means "no burn" — runway is effectively infinite, not zero.
  const runwayMonths = monthlyBurn > 0
    ? Math.round((availableCash / monthlyBurn) * 10) / 10
    : null;

  const unclassifiedCents = g.unclassified.reduce((s, t) => s + Math.abs(t.cents), 0);

  const warnings = [];
  if (bizProfit < 0) warnings.push('Business ran at a loss over this period - no tax is owed, but watch the burn.');
  if (bizCash < 0) warnings.push('Business cash is negative over this period - you are spending more than you have.');
  else if (availableCash < 0) warnings.push('Business cash will not cover the tax you owe - reserve the tax before drawing anything.');
  if (safeToPayYourself === 0 && bizProfit > 0 && bizCash >= 0) warnings.push('No safe draw right now - the cash is committed to your buffer and tax.');
  if (g.unclassified.length > 0) warnings.push(`${g.unclassified.length} transaction(s) are unclassified and excluded - set "scope" to "business" or "personal" for accurate numbers.`);

  return {
    period: span,
    taxRate,
    bufferMonths,
    business: { income: bizIncome, expense: bizExpense, profit: bizProfit, cash: bizCash },
    personal: { income: perIncome, expense: perExpense, net: perIncome - perExpense },
    taxOwed,
    availableCash,
    monthlyBurn,
    buffer,
    safeToPayYourself,
    runwayMonths,
    unclassified: { count: g.unclassified.length, cents: unclassifiedCents },
    verdict: verdictFor(runwayMonths, bizProfit),
    warnings
  };
}

// Verdict from runway (the number that actually predicts survival).
function verdictFor(runwayMonths, bizProfit) {
  if (runwayMonths == null) return bizProfit < 0 ? 'AT RISK' : 'HEALTHY';
  if (runwayMonths < 1) return 'AT RISK';
  if (runwayMonths < 3) return 'TIGHT';
  if (runwayMonths < 6) return 'STEADY';
  return 'HEALTHY';
}
