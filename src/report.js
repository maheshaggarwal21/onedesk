// Render the advisor verdict as a plain-text report. ASCII only — this runs in a
// Windows console by default, where fancy unicode (arrows, the infinity sign) turns
// into boxes. Every headline number states the assumption behind it, so the advice
// is auditable rather than a black box.

import { fmtCents } from './money.js';

function runwayText(runwayMonths) {
  if (runwayMonths == null) return 'no business burn (effectively unlimited)';
  const m = runwayMonths;
  return `${m} month${m === 1 ? '' : 's'}`;
}

export function renderReport(a) {
  const L = [];
  const p = a.period;
  L.push(`ONE DESK - money report`);
  L.push(`  period: ${p.from || '?'} to ${p.to || '?'}  (${p.months} month${p.months === 1 ? '' : 's'})     VERDICT: ${a.verdict}`);
  L.push('');
  L.push('  THE THREE ANSWERS');
  L.push(`    safe to pay yourself:  ${fmtCents(a.safeToPayYourself)}   (after tax reserve + a ${a.bufferMonths}-month buffer)`);
  L.push(`    tax to set aside:      ${fmtCents(a.taxOwed)}   (${Math.round(a.taxRate * 100)}% of ${fmtCents(a.business.profit)} business profit)`);
  L.push(`    runway:                ${runwayText(a.runwayMonths)}`);
  L.push('');
  L.push('  BUSINESS');
  L.push(`    income ${fmtCents(a.business.income)}    expenses ${fmtCents(a.business.expense)}    profit ${fmtCents(a.business.profit)}`);
  L.push(`    cash ${fmtCents(a.business.cash)}  -tax ${fmtCents(a.taxOwed)}  -buffer ${fmtCents(a.buffer)}  = drawable ${fmtCents(a.safeToPayYourself)}`);
  L.push('  PERSONAL');
  L.push(`    income ${fmtCents(a.personal.income)}    expenses ${fmtCents(a.personal.expense)}    net ${fmtCents(a.personal.net)}`);
  if (a.warnings.length) {
    L.push('');
    for (const w of a.warnings) L.push(`  ! ${w}`);
  }
  return L.join('\n');
}

// M2: categories, recurring streams, and anomaly flags.
export function renderInsights(ins) {
  const L = [];
  const top = ins.categories.filter((c) => c.outCents > 0).slice(0, 6);
  if (top.length) {
    L.push('  SPEND BY CATEGORY (top)');
    for (const c of top) L.push(`    ${c.category.padEnd(14)} ${fmtCents(c.outCents)}   (${c.count} txn${c.count === 1 ? '' : 's'})`);
  }

  if (ins.recurring.length) {
    L.push('');
    L.push('  RECURRING');
    for (const r of ins.recurring) {
      const arrow = r.direction === 'in' ? '+' : '-';
      L.push(`    ${arrow}${fmtCents(r.typicalCents)}  ${r.label} (${r.scope}, ${r.cadence}, ${r.occurrences}x)`);
    }
  }

  L.push('');
  if (ins.anomalies.length) {
    L.push('  ANOMALIES');
    for (const a of ins.anomalies) L.push(`    [${a.severity}] ${a.detail}`);
  } else {
    L.push('  ANOMALIES: none flagged');
  }
  return L.join('\n');
}

// M3: plain-language guidance from narrate().
export function renderNarrative(n) {
  const L = ['  GUIDANCE'];
  for (const g of n.guidance) L.push(`    - ${g}`);
  if (n.flow.length) {
    L.push('');
    for (const f of n.flow) L.push(`    - ${f}`);
  }
  if (n.watch.length) {
    L.push('');
    L.push('  WATCH');
    for (const w of n.watch) L.push(`    - ${w}`);
  }
  return L.join('\n');
}

// M3: per-month breakdown from monthlyBreakdown().
export function renderMonthly(rows) {
  const L = ['ONE DESK - monthly breakdown', ''];
  if (!rows.length) {
    L.push('  (no transactions)');
    return L.join('\n');
  }
  for (const r of rows) {
    L.push(`  ${r.month}`);
    L.push(`    business    in ${fmtCents(r.business.inCents)}   out ${fmtCents(r.business.outCents)}   net ${fmtCents(r.business.net)}`);
    L.push(`    personal    in ${fmtCents(r.personal.inCents)}   out ${fmtCents(r.personal.outCents)}   net ${fmtCents(r.personal.net)}`);
    if (r.unclassified.inCents || r.unclassified.outCents) {
      L.push(`    unclassified   in ${fmtCents(r.unclassified.inCents)}   out ${fmtCents(r.unclassified.outCents)}`);
    }
    if (r.topCategories.length) {
      L.push(`    top spend: ${r.topCategories.map((c) => `${c.category} ${fmtCents(c.outCents)}`).join(', ')}`);
    }
  }
  return L.join('\n');
}
