import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAmount, parseDate, detectColumns, importCsv } from '../src/importers.js';

test('parseAmount handles currency, commas, signs, and accounting negatives', () => {
  assert.equal(parseAmount('$1,234.56'), 1234.56);
  assert.equal(parseAmount('(50.00)'), -50);
  assert.equal(parseAmount('-5'), -5);
  assert.equal(parseAmount('+12.5'), 12.5);
  assert.equal(parseAmount(''), null);
  assert.equal(parseAmount('n/a'), null);
});

test('parseDate normalizes to ISO under mdy/dmy/ymd', () => {
  assert.equal(parseDate('2026-03-04'), '2026-03-04');
  assert.equal(parseDate('01/02/2026', 'mdy'), '2026-01-02');
  assert.equal(parseDate('01/02/2026', 'dmy'), '2026-02-01');
  assert.equal(parseDate('2026/03/04', 'ymd'), '2026-03-04');
  assert.equal(parseDate('1/2/26', 'mdy'), '2026-01-02');
  assert.equal(parseDate('garbage'), null);
  assert.equal(parseDate('13/40/2026', 'mdy'), null); // out of range
});

test('detectColumns maps common header aliases', () => {
  const cols = detectColumns(['Posting Date', 'Description', 'Debit', 'Credit']);
  assert.equal(cols.date, 0);
  assert.equal(cols.description, 1);
  assert.equal(cols.debit, 2);
  assert.equal(cols.credit, 3);
  assert.equal(cols.amount, -1);
});

test('importCsv reads a single signed amount column', () => {
  const csv = 'Date,Description,Amount\n01/05/2026,Client invoice,"$5,000.00"\n01/10/2026,AWS,-300';
  const { transactions, skipped } = importCsv(csv, { dateFormat: 'mdy' });
  assert.equal(skipped, 0);
  assert.deepEqual(transactions[0], { date: '2026-01-05', amount: 5000, description: 'Client invoice' });
  assert.deepEqual(transactions[1], { date: '2026-01-10', amount: -300, description: 'AWS' });
});

test('importCsv reads separate debit/credit columns (debit is money out)', () => {
  const csv = 'Transaction Date,Memo,Debit,Credit\n2026-02-01,Payroll,1200.00,\n2026-02-03,Client payment,,4000.00';
  const { transactions } = importCsv(csv);
  assert.equal(transactions[0].amount, -1200); // debit -> negative
  assert.equal(transactions[1].amount, 4000); // credit -> positive
  assert.equal(transactions[0].description, 'Payroll');
});

test('importCsv skips unparseable rows and throws on a shapeless header', () => {
  const csv = 'Date,Description,Amount\nbad-date,x,10\n2026-01-01,ok,20';
  const { transactions, skipped } = importCsv(csv);
  assert.equal(transactions.length, 1);
  assert.equal(skipped, 1);
  assert.throws(() => importCsv('Foo,Bar\n1,2'), /could not find/);
});
