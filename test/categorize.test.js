import test from 'node:test';
import assert from 'node:assert/strict';
import { categorize, categorySummary, KNOWN_CATEGORIES } from '../src/categorize.js';

test('categorize keeps a known input category', () => {
  assert.equal(categorize({ cents: -300, category: 'hosting' }), 'hosting');
  assert.equal(categorize({ cents: -1500, category: 'housing' }), 'housing');
});

test('categorize infers from description when the category is missing or unknown', () => {
  assert.equal(categorize({ cents: -300, description: 'AWS bill' }), 'hosting');
  assert.equal(categorize({ cents: 5000, description: 'Client invoice' }), 'income');
  assert.equal(categorize({ cents: -50, description: 'Netflix' }), 'entertainment');
  assert.equal(categorize({ cents: -600, description: 'Groceries' }), 'groceries');
  assert.equal(categorize({ cents: -300, category: 'misc', description: 'AWS' }), 'hosting'); // unknown cat -> infer
});

test('categorize falls back by direction', () => {
  assert.equal(categorize({ cents: -100, description: 'zzz unknown' }), 'other');
  assert.equal(categorize({ cents: 100, description: 'zzz unknown' }), 'income-other');
  assert.ok(KNOWN_CATEGORIES.has('other') && KNOWN_CATEGORIES.has('income-other'));
});

test('categorySummary rolls up and sorts by spend', () => {
  const rows = categorySummary([
    { cents: -30000, description: 'AWS' },
    { cents: -60000, description: 'Groceries' },
    { cents: 500000, description: 'Client invoice' },
    { cents: -9900, description: 'SaaS license' }
  ]);
  assert.equal(rows[0].category, 'groceries');
  assert.equal(rows[0].outCents, 60000);
  assert.equal(rows[1].category, 'hosting');
  assert.equal(rows[2].category, 'software');
  const income = rows.find((r) => r.category === 'income');
  assert.equal(income.inCents, 500000);
  assert.equal(income.outCents, 0);
});
