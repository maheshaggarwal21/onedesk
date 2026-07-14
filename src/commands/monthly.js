// `onedesk monthly [file]` — the per-month breakdown (business/personal/unclassified
// in-out-net + top spend categories per month). --json emits the raw rows.

import { existsSync } from 'node:fs';
import { parseFile } from '../ingest.js';
import { loadDataset } from '../model.js';
import { monthlyBreakdown } from '../monthly.js';
import { renderMonthly } from '../report.js';

export default async function monthly(args) {
  const file = args.find((a) => !a.startsWith('--')) || 'transactions.json';
  if (!existsSync(file)) {
    console.error(`onedesk: no such file "${file}" — pass a transactions JSON or CSV path`);
    return 1;
  }
  let dataset;
  try {
    dataset = loadDataset(parseFile(file));
  } catch (err) {
    console.error(`onedesk: could not read ${file}: ${err.message}`);
    return 1;
  }
  const rows = monthlyBreakdown(dataset);
  if (args.includes('--json')) {
    console.log(JSON.stringify(rows, null, 2));
    return 0;
  }
  console.log(renderMonthly(rows));
  return 0;
}
