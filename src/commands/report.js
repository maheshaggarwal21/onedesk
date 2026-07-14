// `onedesk report [file]` — read a transactions file, run the advisor, print the
// report. Flags: --json (raw analysis object), --tax <rate>, --buffer <months>.

import { existsSync } from 'node:fs';
import { parseFile } from '../ingest.js';
import { loadDataset } from '../model.js';
import { analyze } from '../advisor.js';
import { renderReport } from '../report.js';
import { normalizeRate } from '../money.js';

function optValue(args, name) {
  const eq = args.find((a) => a.startsWith(`${name}=`));
  if (eq) return eq.slice(name.length + 1);
  const i = args.indexOf(name);
  if (i !== -1 && args[i + 1] && !args[i + 1].startsWith('--')) return args[i + 1];
  return null;
}

export default async function report(args) {
  const file = args.find((a) => !a.startsWith('--')) || 'transactions.json';
  if (!existsSync(file)) {
    console.error(`onedesk: no such file "${file}" — pass a transactions JSON or CSV path`);
    console.error('       e.g. onedesk report examples/sample-transactions.json');
    return 1;
  }

  let dataset;
  try {
    dataset = loadDataset(parseFile(file));
  } catch (err) {
    console.error(`onedesk: could not read ${file}: ${err.message}`);
    return 1;
  }

  const tax = optValue(args, '--tax');
  if (tax != null) dataset.taxRate = normalizeRate(tax);
  const buffer = optValue(args, '--buffer');
  if (buffer != null && Number.isFinite(Number(buffer))) dataset.bufferMonths = Number(buffer);

  const analysis = analyze(dataset);

  if (args.includes('--json')) {
    console.log(JSON.stringify(analysis, null, 2));
    return 0;
  }
  console.log(renderReport(analysis));
  return 0;
}
