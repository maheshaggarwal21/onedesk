import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeTransaction, loadDataset } from '../src/model.js';

test('normalizeTransaction converts amount to cents and keeps fields', () => {
  const t = normalizeTransaction({ date: '2026-01-01', amount: -12.5, description: 'x', category: 'misc' });
  assert.equal(t.cents, -1250);
  assert.equal(t.date, '2026-01-01');
  assert.equal(t.category, 'misc');
  assert.equal(t.scope, 'unclassified'); // no hint in "x"
});

test('normalizeTransaction rejects a bad date', () => {
  assert.throws(() => normalizeTransaction({ date: '2026-1-1', amount: 1 }, 3), /transaction 3: date must be/);
});

test('normalizeTransaction rejects a non-numeric amount', () => {
  assert.throws(() => normalizeTransaction({ date: '2026-01-01', amount: 'abc' }), /amount must be a number/);
  assert.throws(() => normalizeTransaction({ date: '2026-01-01' }), /amount must be a number/);
});

test('explicit scope beats a keyword hint', () => {
  const t = normalizeTransaction({ date: '2026-01-01', amount: 1, scope: 'business', description: 'groceries' });
  assert.equal(t.scope, 'business');
});

test('account resolves scope when scope is absent', () => {
  const t = normalizeTransaction({ date: '2026-01-01', amount: 1, account: 'personal' });
  assert.equal(t.scope, 'personal');
});

test('loadDataset applies safe defaults', () => {
  const ds = loadDataset([]);
  assert.equal(ds.taxRate, 0.25);
  assert.equal(ds.bufferMonths, 3);
  assert.deepEqual(ds.opening, { business: 0, personal: 0 });
  assert.deepEqual(ds.txns, []);
});

test('loadDataset reads an envelope and converts opening balances to cents', () => {
  const ds = loadDataset({
    taxRate: 30,
    bufferMonths: 2,
    openingBalance: { business: 100, personal: 50 },
    transactions: [{ date: '2026-01-01', amount: 5, scope: 'business' }]
  });
  assert.equal(ds.taxRate, 0.3); // 30 read as a percentage
  assert.equal(ds.bufferMonths, 2);
  assert.equal(ds.opening.business, 10000);
  assert.equal(ds.opening.personal, 5000);
  assert.equal(ds.txns.length, 1);
});

test('loadDataset rejects a non-array transactions field', () => {
  assert.throws(() => loadDataset({ transactions: 5 }), /must be an array/);
});
