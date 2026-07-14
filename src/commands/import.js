// `onedesk import <bank.csv> [--store ledger.json] [--date-format mdy|dmy|ymd]`
// Reads a bank/spreadsheet CSV, normalizes it, and merges it into a local JSON ledger
// (de-duplicating re-imports). The ledger is itself a dataset, so afterwards you run
// `onedesk report <ledger.json>`.

import { existsSync, readFileSync } from 'node:fs';
import { importCsv } from '../importers.js';
import { loadStore, addTransactions, saveStore } from '../store.js';

function optValue(args, name) {
  const eq = args.find((a) => a.startsWith(`${name}=`));
  if (eq) return eq.slice(name.length + 1);
  const i = args.indexOf(name);
  if (i !== -1 && args[i + 1] && !args[i + 1].startsWith('--')) return args[i + 1];
  return null;
}

export default async function importCommand(args) {
  const file = args.find((a) => !a.startsWith('--'));
  if (!file) {
    console.error('onedesk: usage: onedesk import <bank.csv> [--store ledger.json] [--date-format mdy|dmy|ymd]');
    return 1;
  }
  if (!existsSync(file)) {
    console.error(`onedesk: no such file "${file}"`);
    return 1;
  }

  const dateFormat = optValue(args, '--date-format') || 'mdy';
  const storePath = optValue(args, '--store') || 'onedesk-ledger.json';

  let result;
  try {
    result = importCsv(readFileSync(file, 'utf8'), { dateFormat });
  } catch (err) {
    console.error(`onedesk: import failed: ${err.message}`);
    return 1;
  }

  const store = loadStore(storePath);
  const { added, skipped } = addTransactions(store, result.transactions);
  saveStore(storePath, store);

  console.log(`onedesk: imported ${added} new transaction(s) into ${storePath}`);
  console.log(`         (${skipped} duplicate(s) skipped, ${result.skipped} unparseable row(s); ${store.transactions.length} total in ledger)`);
  console.log('         new transactions have no business/personal scope yet — edit the ledger to set it, then:');
  console.log(`         onedesk report ${storePath}`);
  return 0;
}
