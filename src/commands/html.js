// `onedesk html [file] [--out report.html]` — write a self-contained static HTML
// dashboard. No server, no network: it is a file you open in a browser.

import { existsSync } from 'node:fs';
import { parseFile } from '../ingest.js';
import { loadDataset } from '../model.js';
import { renderHtml } from '../html.js';
import { atomicWrite } from '../files.js';

function optValue(args, name) {
  const eq = args.find((a) => a.startsWith(`${name}=`));
  if (eq) return eq.slice(name.length + 1);
  const i = args.indexOf(name);
  if (i !== -1 && args[i + 1] && !args[i + 1].startsWith('--')) return args[i + 1];
  return null;
}

export default async function html(args) {
  const file = args.find((a) => !a.startsWith('--')) || 'transactions.json';
  if (!existsSync(file)) {
    console.error(`onedesk: no such file "${file}" — pass a transactions JSON/CSV or a ledger path`);
    return 1;
  }
  let dataset;
  try {
    dataset = loadDataset(parseFile(file));
  } catch (err) {
    console.error(`onedesk: could not read ${file}: ${err.message}`);
    return 1;
  }

  const out = optValue(args, '--out') || 'onedesk-report.html';
  atomicWrite(out, renderHtml(dataset));
  console.log(`onedesk: wrote ${out} — open it in your browser (it is a static local file).`);
  return 0;
}
