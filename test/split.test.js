import test from 'node:test';
import assert from 'node:assert/strict';
import { inferScope, groupByScope } from '../src/split.js';

test('inferScope trusts explicit scope, then account', () => {
  assert.equal(inferScope({ scope: 'business' }), 'business');
  assert.equal(inferScope({ account: 'personal' }), 'personal');
  assert.equal(inferScope({ scope: 'personal', account: 'business' }), 'personal');
});

test('inferScope falls back to keyword hints', () => {
  assert.equal(inferScope({ description: 'Client invoice #12' }), 'business');
  assert.equal(inferScope({ category: 'groceries' }), 'personal');
  assert.equal(inferScope({ description: 'AWS hosting' }), 'business');
});

test('inferScope refuses to guess when there is no signal', () => {
  assert.equal(inferScope({ description: 'ATM withdrawal' }), 'unclassified');
  assert.equal(inferScope({}), 'unclassified');
});

test('groupByScope buckets transactions and sends unknowns to unclassified', () => {
  const g = groupByScope([
    { scope: 'business', cents: 1 },
    { scope: 'personal', cents: 2 },
    { scope: 'unclassified', cents: 3 },
    { scope: 'weird', cents: 4 }
  ]);
  assert.equal(g.business.length, 1);
  assert.equal(g.personal.length, 1);
  assert.equal(g.unclassified.length, 2); // 'weird' is not a valid bucket
});
