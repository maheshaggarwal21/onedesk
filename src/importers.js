// Import adapters for real bank/spreadsheet CSV exports. Bank CSVs are a mess: the
// columns are named a dozen ways, amounts come as one signed column OR separate
// debit/credit columns, negatives are sometimes "(123.45)", and dates come in
// mdy/dmy/ymd. This maps the common shapes onto One Desk's {date, amount, description}
// so the rest of the engine never has to know where the data came from.

import { splitCsvLine } from './ingest.js';

// "$1,234.56" -> 1234.56 ; "(50.00)" -> -50 ; "-5" -> -5 ; "" -> null
export function parseAmount(raw) {
  if (raw == null) return null;
  let s = String(raw).trim();
  if (s === '') return null;
  let neg = false;
  if (/^\(.*\)$/.test(s)) { neg = true; s = s.slice(1, -1); } // accounting negative
  s = s.replace(/[$£€,\s]/g, '');
  if (s.startsWith('-')) { neg = true; s = s.slice(1); }
  if (s.startsWith('+')) s = s.slice(1);
  if (s === '') return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return neg ? -n : n;
}

// Normalize a date to ISO YYYY-MM-DD. Handles ISO already, and slash/dash dates with
// an explicit format (mdy default, dmy, or ymd). Two-digit years become 20xx.
export function parseDate(raw, fmt = 'mdy') {
  const s = String(raw || '').trim();
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const m = s.match(/^(\d{1,4})[/-](\d{1,2})[/-](\d{1,4})$/);
  if (!m) return null;
  let y;
  let mm;
  let dd;
  if (fmt === 'ymd') { y = m[1]; mm = m[2]; dd = m[3]; }
  else if (fmt === 'dmy') { dd = m[1]; mm = m[2]; y = m[3]; }
  else { mm = m[1]; dd = m[2]; y = m[3]; } // mdy
  if (String(y).length <= 2) y = `20${String(y).padStart(2, '0')}`;
  mm = String(mm).padStart(2, '0');
  dd = String(dd).padStart(2, '0');
  if (+mm < 1 || +mm > 12 || +dd < 1 || +dd > 31) return null;
  return `${y}-${mm}-${dd}`;
}

const ROLES = {
  date: ['date', 'transaction date', 'posting date', 'posted date', 'trans date', 'value date'],
  amount: ['amount', 'value'],
  debit: ['debit', 'withdrawal', 'withdrawals', 'money out', 'paid out', 'debit amount'],
  credit: ['credit', 'deposit', 'deposits', 'money in', 'paid in', 'credit amount'],
  description: ['description', 'memo', 'payee', 'name', 'details', 'narrative', 'reference', 'particulars']
};

export function detectColumns(header) {
  const lower = header.map((h) => String(h).toLowerCase().trim());
  const find = (names) => {
    for (const n of names) {
      const i = lower.indexOf(n);
      if (i !== -1) return i;
    }
    return -1;
  };
  const map = {};
  for (const [role, names] of Object.entries(ROLES)) map[role] = find(names);
  return map;
}

export function importCsv(text, { dateFormat = 'mdy' } = {}) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length < 2) return { transactions: [], skipped: 0 };

  const header = splitCsvLine(lines[0]);
  const cols = detectColumns(header);
  if (cols.date === -1 || (cols.amount === -1 && cols.debit === -1 && cols.credit === -1)) {
    throw new Error('could not find a date column and an amount/debit/credit column in the CSV header');
  }

  const transactions = [];
  let skipped = 0;
  for (const line of lines.slice(1)) {
    const f = splitCsvLine(line);
    const date = parseDate(f[cols.date], dateFormat);

    let amount = null;
    if (cols.amount !== -1) {
      amount = parseAmount(f[cols.amount]);
    } else {
      const debit = cols.debit !== -1 ? parseAmount(f[cols.debit]) : null;
      const credit = cols.credit !== -1 ? parseAmount(f[cols.credit]) : null;
      if (credit != null && credit !== 0) amount = Math.abs(credit);
      else if (debit != null && debit !== 0) amount = -Math.abs(debit);
      else amount = 0;
    }

    const description = cols.description !== -1 ? (f[cols.description] || '') : '';
    if (!date || amount == null) {
      skipped += 1;
      continue;
    }
    transactions.push({ date, amount, description });
  }
  return { transactions, skipped };
}
