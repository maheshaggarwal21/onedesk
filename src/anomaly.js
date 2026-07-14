// Anomaly flags: the "look at this" moments. Three kinds, each deterministic and each
// tuned to stay quiet on a normal month (a flag people ignore is worse than no flag):
//   1. scope-mismatch  - the description reads business but it is filed under personal
//                        (or vice versa). This is the classic "business expense in the
//                        personal account" leak the whole product exists to catch.
//   2. category-spike  - a category's latest-month spend jumps well above its own
//                        prior-month average.
//   3. large-expense   - a single expense far above the typical expense size.

import { monthKey } from './dates.js';
import { inferScope } from './split.js';
import { categorize } from './categorize.js';
import { fmtCents } from './money.js';

export function detectAnomalies(txns) {
  const flags = [];

  // 1. scope mismatch: infer scope from the TEXT only (ignore the recorded scope), and
  // flag when a confident text signal disagrees with how it was filed.
  for (const t of txns) {
    if (t.scope === 'unclassified') continue;
    const fromText = inferScope({ description: t.description, category: t.category });
    if ((fromText === 'business' || fromText === 'personal') && fromText !== t.scope) {
      flags.push({
        type: 'scope-mismatch',
        severity: 'medium',
        date: t.date,
        cents: t.cents,
        detail: `"${t.description || 'transaction'}" (${fmtCents(t.cents)}) reads like a ${fromText} item but is filed under ${t.scope}.`
      });
    }
  }

  // 2. category spike: per expense-category monthly totals; compare the latest month to
  // the average of the earlier months.
  const byCat = new Map();
  for (const t of txns) {
    if (t.cents >= 0) continue;
    const cat = categorize(t);
    const mk = monthKey(t.date);
    if (!byCat.has(cat)) byCat.set(cat, new Map());
    const mm = byCat.get(cat);
    mm.set(mk, (mm.get(mk) || 0) + Math.abs(t.cents));
  }
  for (const [cat, mm] of byCat) {
    const months = [...mm.keys()].sort();
    if (months.length < 2) continue;
    const latest = months[months.length - 1];
    const prior = months.slice(0, -1);
    const priorAvg = Math.round(prior.reduce((s, m) => s + mm.get(m), 0) / prior.length);
    const latestVal = mm.get(latest);
    if (priorAvg > 0 && latestVal >= priorAvg * 1.5 && latestVal - priorAvg >= 5000) {
      const pct = Math.round((latestVal / priorAvg - 1) * 100);
      flags.push({
        type: 'category-spike',
        severity: 'medium',
        date: latest,
        cents: -latestVal,
        detail: `${cat} spending was ${pct}% higher in ${latest} (${fmtCents(latestVal)}) than the prior-month average (${fmtCents(priorAvg)}).`
      });
    }
  }

  // 3. large one-off expense: 4x the median expense and at least $500, so a normal rent
  // or payroll line in a smooth month does not trip it.
  const expenseAmts = txns.filter((t) => t.cents < 0).map((t) => Math.abs(t.cents)).sort((a, b) => a - b);
  if (expenseAmts.length >= 4) {
    const median = expenseAmts[Math.floor(expenseAmts.length / 2)];
    for (const t of txns) {
      if (t.cents >= 0) continue;
      const a = Math.abs(t.cents);
      if (a >= median * 4 && a >= 50000) {
        flags.push({
          type: 'large-expense',
          severity: 'low',
          date: t.date,
          cents: t.cents,
          detail: `Unusually large expense: "${t.description || 'transaction'}" at ${fmtCents(a)} (typical expense is about ${fmtCents(median)}).`
        });
      }
    }
  }

  const rank = { high: 0, medium: 1, low: 2 };
  flags.sort((a, b) => rank[a.severity] - rank[b.severity]);
  return flags;
}
