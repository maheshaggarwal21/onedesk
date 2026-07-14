// Recurring-charge detection: subscriptions, salary, rent — the money that comes or
// goes every month. Deterministic and conservative: it only claims a stream is
// recurring when the same payee shows up in two or more distinct months with a
// consistent amount. A high false-positive rate here would erode trust, so the bar is
// "clearly repeating", not "might repeat".

import { monthIndex, monthKey } from './dates.js';

// Normalize a payee key: drop digits and punctuation from the description, collapse
// spaces, and bind it to scope + direction. "AWS #4821" and "AWS #5533" collapse to
// the same stream; income and expense with the same name stay separate.
function payeeKey(t) {
  const base = String(t.description || '')
    .toLowerCase()
    .replace(/[0-9]+/g, ' ')
    .replace(/[^a-z ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return `${t.scope}|${t.cents >= 0 ? 'in' : 'out'}|${base}`;
}

export function detectRecurring(txns) {
  const groups = new Map();
  for (const t of txns) {
    if (!String(t.description || '').trim()) continue; // no payee name -> can't group
    const k = payeeKey(t);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(t);
  }

  const streams = [];
  for (const arr of groups.values()) {
    if (arr.length < 2) continue;

    const months = [...new Set(arr.map((t) => monthKey(t.date)))].sort();
    if (months.length < 2) continue; // two in the same month is not "recurring"

    const amounts = arr.map((t) => Math.abs(t.cents)).sort((a, b) => a - b);
    const median = amounts[Math.floor(amounts.length / 2)];
    const spread = amounts[amounts.length - 1] - amounts[0];
    // allow small variation: within 25% of the median, or within $2 absolute
    if (spread > Math.max(200, Math.round(median * 0.25))) continue;

    const idx = [...new Set(arr.map((t) => monthIndex(t.date)))].sort((a, b) => a - b);
    let maxGap = 1;
    for (let i = 1; i < idx.length; i++) maxGap = Math.max(maxGap, idx[i] - idx[i - 1]);

    streams.push({
      label: arr[0].description,
      scope: arr[0].scope,
      direction: arr[0].cents >= 0 ? 'in' : 'out',
      typicalCents: median,
      occurrences: arr.length,
      months,
      cadence: maxGap <= 1 ? 'monthly' : 'irregular'
    });
  }

  // monthly streams first, then largest amount first
  streams.sort((a, b) =>
    (a.cadence === 'monthly' ? 0 : 1) - (b.cadence === 'monthly' ? 0 : 1) ||
    b.typicalCents - a.typicalCents);
  return streams;
}
