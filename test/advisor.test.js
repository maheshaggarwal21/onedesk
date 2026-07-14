import test from 'node:test';
import assert from 'node:assert/strict';
import { loadDataset } from '../src/model.js';
import { analyze, periodMonths } from '../src/advisor.js';

test('periodMonths counts inclusive whole months', () => {
  const span = periodMonths([{ date: '2026-04-05' }, { date: '2026-06-30' }, { date: '2026-05-01' }]);
  assert.equal(span.months, 3);
  assert.equal(span.from, '2026-04-05');
  assert.equal(span.to, '2026-06-30');
});

test('a healthy month: profit, tax, buffer, safe-to-pay, and runway line up', () => {
  const a = analyze(loadDataset({
    taxRate: 0.25,
    bufferMonths: 2,
    openingBalance: { business: 1000 },
    transactions: [
      { date: '2026-01-05', amount: 5000, scope: 'business', description: 'invoice' },
      { date: '2026-01-10', amount: -1000, scope: 'business', description: 'aws' },
      { date: '2026-01-12', amount: -500, scope: 'personal', description: 'groceries' }
    ]
  }));
  assert.equal(a.business.income, 500000);
  assert.equal(a.business.expense, 100000);
  assert.equal(a.business.profit, 400000);
  assert.equal(a.business.cash, 500000);       // 1000 opening + 4000 net
  assert.equal(a.taxOwed, 100000);             // 25% of 4000 profit
  assert.equal(a.availableCash, 400000);       // cash - tax
  assert.equal(a.monthlyBurn, 100000);         // 1000 expense / 1 month
  assert.equal(a.buffer, 200000);              // burn * 2
  assert.equal(a.safeToPayYourself, 200000);   // available - buffer
  assert.equal(a.runwayMonths, 4);             // available / burn
  assert.equal(a.verdict, 'STEADY');
  assert.equal(a.personal.net, -50000);
  assert.equal(a.unclassified.count, 0);
  assert.equal(a.warnings.length, 0);
});

test('a loss with negative cash and an unclassified txn: AT RISK, no draw, warned', () => {
  const a = analyze(loadDataset({
    taxRate: 0.2,
    bufferMonths: 3,
    openingBalance: { business: 500 },
    transactions: [
      { date: '2026-03-01', amount: 1000, scope: 'business', description: 'invoice' },
      { date: '2026-03-15', amount: -3000, scope: 'business', description: 'aws server' },
      { date: '2026-03-20', amount: -200, description: 'ATM withdrawal' }
    ]
  }));
  assert.equal(a.business.profit, -200000);
  assert.equal(a.taxOwed, 0);                  // no tax on a loss
  assert.equal(a.business.cash, -150000);      // 500 + (1000 - 3000)
  assert.equal(a.safeToPayYourself, 0);        // nothing safe to draw
  assert.equal(a.runwayMonths, -0.5);
  assert.equal(a.verdict, 'AT RISK');
  assert.equal(a.unclassified.count, 1);
  assert.equal(a.unclassified.cents, 20000);   // |−200|
  // loss + negative-cash + unclassified
  assert.equal(a.warnings.length, 3);
  assert.ok(a.warnings.some((w) => /loss/.test(w)));
  assert.ok(a.warnings.some((w) => /negative/.test(w)));
  assert.ok(a.warnings.some((w) => /unclassified/.test(w)));
});

test('no business burn gives null runway and a HEALTHY verdict', () => {
  const a = analyze(loadDataset({
    openingBalance: { business: 1000 },
    transactions: [{ date: '2026-02-01', amount: 2000, scope: 'business', description: 'invoice' }]
  }));
  assert.equal(a.monthlyBurn, 0);
  assert.equal(a.runwayMonths, null);
  assert.equal(a.taxOwed, 50000);              // default 25% of 2000
  assert.equal(a.safeToPayYourself, 250000);   // cash 3000 - tax 500 - buffer 0
  assert.equal(a.verdict, 'HEALTHY');
});

test('an empty dataset is well defined, not a crash or NaN', () => {
  const a = analyze(loadDataset([]));
  assert.equal(a.safeToPayYourself, 0);
  assert.equal(a.taxOwed, 0);
  assert.equal(a.runwayMonths, null);
  assert.equal(a.verdict, 'HEALTHY');
  assert.equal(a.period.months, 1);
  assert.equal(a.warnings.length, 0);
});

test('cents math means income and profit stay exact across float amounts', () => {
  const a = analyze(loadDataset({
    transactions: [
      { date: '2026-01-01', amount: 0.1, scope: 'business' },
      { date: '2026-01-01', amount: 0.2, scope: 'business' },
      { date: '2026-01-02', amount: -0.3, scope: 'business' }
    ]
  }));
  assert.equal(a.business.income, 30);         // 10 + 20, exact
  assert.equal(a.business.expense, 30);
  assert.equal(a.business.profit, 0);          // no float drift
});
