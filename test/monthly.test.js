import test from 'node:test';
import assert from 'node:assert/strict';
import { loadDataset } from '../src/model.js';
import { monthlyBreakdown } from '../src/monthly.js';

test('monthlyBreakdown splits by calendar month with scope in/out/net', () => {
  const rows = monthlyBreakdown(loadDataset({
    transactions: [
      { date: '2026-01-05', amount: 5000, scope: 'business', description: 'Client invoice' },
      { date: '2026-01-10', amount: -1000, scope: 'business', description: 'AWS' },
      { date: '2026-01-12', amount: -500, scope: 'personal', description: 'Groceries' },
      { date: '2026-02-05', amount: 3000, scope: 'business', description: 'Client invoice' },
      { date: '2026-02-20', amount: -200, description: 'ATM withdrawal' }
    ]
  }));

  assert.equal(rows.length, 2);

  assert.equal(rows[0].month, '2026-01');
  assert.equal(rows[0].business.inCents, 500000);
  assert.equal(rows[0].business.outCents, 100000);
  assert.equal(rows[0].business.net, 400000);
  assert.equal(rows[0].personal.net, -50000);
  assert.equal(rows[0].topCategories[0].category, 'hosting');
  assert.equal(rows[0].topCategories[0].outCents, 100000);

  assert.equal(rows[1].month, '2026-02');
  assert.equal(rows[1].business.net, 300000);
  assert.equal(rows[1].unclassified.outCents, 20000);
});

test('monthlyBreakdown on an empty dataset is an empty list', () => {
  assert.deepEqual(monthlyBreakdown(loadDataset([])), []);
});
