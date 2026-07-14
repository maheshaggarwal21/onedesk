import test from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { existsSync, rmSync } from 'node:fs';
import { emptyStore, loadStore, saveStore, addTransactions, fingerprint } from '../src/store.js';

test('emptyStore is a valid empty dataset envelope', () => {
  const s = emptyStore();
  assert.equal(s.taxRate, 0.25);
  assert.equal(s.bufferMonths, 3);
  assert.deepEqual(s.transactions, []);
  assert.deepEqual(s.openingBalance, { business: 0, personal: 0 });
});

test('loadStore returns an empty store for a missing path', () => {
  const s = loadStore(join(tmpdir(), 'onedesk-does-not-exist-xyz123.json'));
  assert.deepEqual(s.transactions, []);
});

test('addTransactions de-duplicates and keeps chronological order', () => {
  const s = emptyStore();
  const r1 = addTransactions(s, [
    { date: '2026-01-02', amount: -10, description: 'Coffee' },
    { date: '2026-01-01', amount: 100, description: 'Invoice' }
  ]);
  assert.equal(r1.added, 2);

  const r2 = addTransactions(s, [
    { date: '2026-01-02', amount: -10, description: 'Coffee' }, // duplicate
    { date: '2026-01-03', amount: -20, description: 'Lunch' }   // new
  ]);
  assert.equal(r2.added, 1);
  assert.equal(r2.skipped, 1);
  assert.equal(s.transactions.length, 3);
  assert.equal(s.transactions[0].date, '2026-01-01');
  assert.equal(s.transactions[2].date, '2026-01-03');
});

test('fingerprint ignores description case and surrounding space', () => {
  assert.equal(
    fingerprint({ date: '2026-01-01', amount: -10, description: '  Coffee ' }),
    fingerprint({ date: '2026-01-01', amount: -10, description: 'coffee' })
  );
});

test('saveStore then loadStore round-trips through disk', () => {
  const p = join(tmpdir(), `onedesk-store-test-${process.pid}.json`);
  try {
    const s = emptyStore();
    addTransactions(s, [{ date: '2026-01-01', amount: 100, description: 'Invoice' }]);
    saveStore(p, s);
    assert.ok(existsSync(p));
    const back = loadStore(p);
    assert.equal(back.transactions.length, 1);
    assert.equal(back.transactions[0].amount, 100);
  } finally {
    if (existsSync(p)) rmSync(p);
  }
});
