// Per-month breakdown: split the period into calendar months and, for each, report
// business / personal / unclassified in-out-net plus that month's top spend
// categories. Pure over the normalized dataset; the CLI just renders the rows.

import { monthKey } from './dates.js';
import { groupByScope } from './split.js';
import { categorize } from './categorize.js';

function scopeStats(txns) {
  const inCents = txns.reduce((s, t) => (t.cents > 0 ? s + t.cents : s), 0);
  const outCents = txns.reduce((s, t) => (t.cents < 0 ? s - t.cents : s), 0);
  return { inCents, outCents, net: inCents - outCents };
}

export function monthlyBreakdown(dataset) {
  const byMonth = new Map();
  for (const t of dataset.txns) {
    const mk = monthKey(t.date);
    if (!byMonth.has(mk)) byMonth.set(mk, []);
    byMonth.get(mk).push(t);
  }

  return [...byMonth.keys()].sort().map((mk) => {
    const txns = byMonth.get(mk);
    const g = groupByScope(txns);

    const catOut = new Map();
    for (const t of txns) {
      if (t.cents >= 0) continue;
      const c = categorize(t);
      catOut.set(c, (catOut.get(c) || 0) + Math.abs(t.cents));
    }
    const topCategories = [...catOut.entries()]
      .map(([category, outCents]) => ({ category, outCents }))
      .sort((a, b) => b.outCents - a.outCents)
      .slice(0, 3);

    return {
      month: mk,
      business: scopeStats(g.business),
      personal: scopeStats(g.personal),
      unclassified: scopeStats(g.unclassified),
      topCategories
    };
  });
}
