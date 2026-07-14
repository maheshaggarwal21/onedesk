// The advisor's voice: turn the numbers into plain-language guidance. This is the
// "personal assistant" the product promises, done as DETERMINISTIC rules over the
// analysis — not an LLM. Same numbers in, same words out, so it is testable, offline,
// and never invents a figure. Three buckets: guidance (what to do about the three
// answers), flow (where money repeats and concentrates), and watch (what to check).

import { fmtCents } from './money.js';

export function narrate(a, ins) {
  const guidance = [];
  const flow = [];
  const watch = [];

  // 1. safe to pay yourself
  if (a.safeToPayYourself > 0) {
    guidance.push(`You can safely pay yourself ${fmtCents(a.safeToPayYourself)} this period — that keeps a ${a.bufferMonths}-month buffer and reserves ${fmtCents(a.taxOwed)} for tax.`);
  } else if (a.business.profit > 0) {
    guidance.push('Hold off on paying yourself this period — the available cash is committed to your safety buffer and tax reserve.');
  } else {
    guidance.push('There is nothing safe to draw this period — the business is not profitable over this window.');
  }

  // 2. tax
  if (a.taxOwed > 0) {
    guidance.push(`Set aside ${fmtCents(a.taxOwed)} for tax (${Math.round(a.taxRate * 100)}% of your ${fmtCents(a.business.profit)} profit). Keep it in a separate account so it is not spent by accident.`);
  } else {
    guidance.push('No tax to set aside this period — there is no business profit to tax.');
  }

  // 3. runway
  if (a.runwayMonths == null) {
    guidance.push('There is no business burn this period, so runway is not a concern right now.');
  } else if (a.verdict === 'HEALTHY') {
    guidance.push(`Your runway is healthy at ${a.runwayMonths} months.`);
  } else if (a.verdict === 'STEADY') {
    guidance.push(`Your runway is ${a.runwayMonths} months — steady, but worth watching.`);
  } else if (a.verdict === 'TIGHT') {
    guidance.push(`Your runway is tight at ${a.runwayMonths} months — cut burn or pull income forward.`);
  } else {
    guidance.push(`Your runway is under a month (${a.runwayMonths}) — this is urgent; reduce spending now.`);
  }

  // flow: recurring money and the biggest cost
  const monthlyOut = ins.recurring.filter((r) => r.cadence === 'monthly' && r.direction === 'out');
  const monthlyIn = ins.recurring.filter((r) => r.cadence === 'monthly' && r.direction === 'in');
  if (monthlyOut.length) {
    const total = monthlyOut.reduce((s, r) => s + r.typicalCents, 0);
    flow.push(`Recurring out: about ${fmtCents(total)} per month across ${monthlyOut.length} item(s) (${monthlyOut.slice(0, 3).map((r) => r.label).join(', ')}).`);
  }
  if (monthlyIn.length) {
    const total = monthlyIn.reduce((s, r) => s + r.typicalCents, 0);
    flow.push(`Recurring in: about ${fmtCents(total)} per month across ${monthlyIn.length} item(s).`);
  }
  const topExpense = ins.categories.find((c) => c.outCents > 0);
  if (topExpense) flow.push(`Your biggest expense category is ${topExpense.category} at ${fmtCents(topExpense.outCents)}.`);

  // watch: anomalies and data-quality warnings, most severe first (anomalies already sorted)
  for (const an of ins.anomalies) watch.push(`[${an.severity}] ${an.detail}`);
  for (const w of a.warnings) watch.push(w);

  return { guidance, flow, watch };
}
