// The transaction model + dataset loader. Everything the advisor sees comes through
// here, so validation is strict and the money is converted to integer cents once,
// at this edge. A bad transaction throws with its index — a money tool should refuse
// ambiguous input rather than quietly compute a wrong number.

import { toCents, normalizeRate } from './money.js';
import { inferScope } from './split.js';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// One raw transaction -> normalized { date, cents, scope, category, description }.
// amount is SIGNED: positive = money in (income), negative = money out (expense).
export function normalizeTransaction(raw, i = 0) {
  if (raw == null || typeof raw !== 'object') {
    throw new Error(`transaction ${i}: expected an object`);
  }
  const date = String(raw.date ?? '').trim();
  if (!DATE_RE.test(date)) {
    throw new Error(`transaction ${i}: date must be YYYY-MM-DD (got ${JSON.stringify(raw.date)})`);
  }
  if (raw.amount == null || raw.amount === '' || !Number.isFinite(Number(raw.amount))) {
    throw new Error(`transaction ${i}: amount must be a number (got ${JSON.stringify(raw.amount)})`);
  }
  return {
    date,
    cents: toCents(raw.amount),
    scope: inferScope(raw),
    category: raw.category ? String(raw.category) : null,
    description: raw.description ? String(raw.description) : ''
  };
}

// Accepts either a bare array of transactions or an envelope object:
//   { asOf, taxRate, bufferMonths, openingBalance:{business,personal}, transactions:[...] }
// Returns a normalized dataset with cents-based opening balances and safe defaults.
export function loadDataset(input) {
  const obj = Array.isArray(input) ? { transactions: input } : (input || {});
  const rawTxns = obj.transactions ?? [];
  if (!Array.isArray(rawTxns)) throw new Error('`transactions` must be an array');

  const txns = rawTxns.map((t, i) => normalizeTransaction(t, i));

  const bufferMonths = Number.isFinite(Number(obj.bufferMonths)) && Number(obj.bufferMonths) >= 0
    ? Number(obj.bufferMonths)
    : 3;

  const ob = obj.openingBalance || {};
  return {
    asOf: obj.asOf ? String(obj.asOf) : null,
    taxRate: obj.taxRate != null ? normalizeRate(obj.taxRate) : 0.25,
    bufferMonths,
    opening: {
      business: toCents(ob.business || 0),
      personal: toCents(ob.personal || 0)
    },
    txns
  };
}
