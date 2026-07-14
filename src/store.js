// The local ledger store. Local-first and privacy-first: financial data stays in a
// plain JSON file on the user's machine, never uploaded. The store is ALSO a valid
// dataset envelope (taxRate / bufferMonths / openingBalance / transactions at top
// level), so `onedesk report <ledger.json>` reads it directly with no conversion.

import { existsSync, readFileSync } from 'node:fs';
import { atomicWrite } from './files.js';

export function emptyStore() {
  return {
    version: 1,
    taxRate: 0.25,
    bufferMonths: 3,
    openingBalance: { business: 0, personal: 0 },
    transactions: []
  };
}

export function loadStore(path) {
  if (!existsSync(path)) return emptyStore();
  const obj = JSON.parse(readFileSync(path, 'utf8'));
  return {
    ...emptyStore(),
    ...obj,
    transactions: Array.isArray(obj.transactions) ? obj.transactions : []
  };
}

// A stable fingerprint for de-duplication: re-importing the same statement must not
// double-count. Date + amount + normalized description is enough to catch true dupes
// without merging genuinely distinct same-day charges of different amounts.
export function fingerprint(t) {
  return `${t.date}|${t.amount}|${String(t.description || '').trim().toLowerCase()}`;
}

export function addTransactions(store, newTxns) {
  const seen = new Set(store.transactions.map(fingerprint));
  let added = 0;
  let skipped = 0;
  for (const t of newTxns) {
    const fp = fingerprint(t);
    if (seen.has(fp)) {
      skipped += 1;
      continue;
    }
    seen.add(fp);
    store.transactions.push(t);
    added += 1;
  }
  store.transactions.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return { store, added, skipped };
}

export function saveStore(path, store) {
  atomicWrite(path, `${JSON.stringify(store, null, 2)}\n`);
}
