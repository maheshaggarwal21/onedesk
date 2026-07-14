// Reading a transactions file. JSON is the primary format (array or envelope). CSV is
// a convenience for bank/spreadsheet exports: a header row plus rows of
// date,amount,scope,category,description. The CSV parser handles quoted fields with
// embedded commas and doubled "" quotes — enough for real exports, not a full RFC.

import { readFileSync } from 'node:fs';

export function parseFile(path) {
  const text = readFileSync(path, 'utf8');
  const lower = path.toLowerCase();
  if (lower.endsWith('.csv')) return { transactions: parseCsv(text) };
  return JSON.parse(text);
}

// Split one CSV line into fields, respecting quotes and "" escapes.
export function splitCsvLine(line) {
  const out = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      out.push(field);
      field = '';
    } else {
      field += c;
    }
  }
  out.push(field);
  return out.map((f) => f.trim());
}

export function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length === 0) return [];
  const header = splitCsvLine(lines[0]).map((h) => h.toLowerCase());
  const col = (name) => header.indexOf(name);
  const iDate = col('date');
  const iAmount = col('amount');
  const iScope = col('scope');
  const iAccount = col('account');
  const iCategory = col('category');
  const iDesc = col('description');
  if (iDate === -1 || iAmount === -1) {
    throw new Error('CSV needs at least "date" and "amount" columns');
  }
  return lines.slice(1).map((line) => {
    const f = splitCsvLine(line);
    const row = { date: f[iDate], amount: f[iAmount] };
    if (iScope !== -1 && f[iScope]) row.scope = f[iScope];
    if (iAccount !== -1 && f[iAccount]) row.account = f[iAccount];
    if (iCategory !== -1 && f[iCategory]) row.category = f[iCategory];
    if (iDesc !== -1 && f[iDesc]) row.description = f[iDesc];
    return row;
  });
}
