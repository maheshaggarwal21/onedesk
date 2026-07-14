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
