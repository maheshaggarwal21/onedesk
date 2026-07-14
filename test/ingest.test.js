import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCsv } from '../src/ingest.js';

test('parseCsv reads columns by header name', () => {
  const rows = parseCsv('date,amount,scope,category,description\n2026-01-01,-12.50,personal,food,Lunch');
  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0], { date: '2026-01-01', amount: '-12.50', scope: 'personal', category: 'food', description: 'Lunch' });
});

test('parseCsv respects quoted fields with embedded commas', () => {
  const rows = parseCsv('date,amount,description\n2026-01-01,-12.50,"Lunch, with tip"');
  assert.equal(rows[0].description, 'Lunch, with tip');
});

test('parseCsv unescapes doubled quotes', () => {
  const rows = parseCsv('date,amount,description\n2026-01-01,5,"He said ""hi"""');
  assert.equal(rows[0].description, 'He said "hi"');
});

test('parseCsv skips blank lines and ignores empty optional cells', () => {
  const rows = parseCsv('date,amount,scope\n\n2026-01-01,5,\n');
  assert.equal(rows.length, 1);
  assert.equal(rows[0].scope, undefined); // empty cell not carried through
});

test('parseCsv requires date and amount columns', () => {
  assert.throws(() => parseCsv('foo,bar\n1,2'), /date.*amount|amount/);
});
