import test from 'node:test';
import assert from 'node:assert/strict';
import { loadDataset } from '../src/model.js';
import { analyze } from '../src/advisor.js';
import { insights } from '../src/insights.js';
import { narrate } from '../src/narrative.js';

function story(input) {
  const ds = loadDataset(input);
  return narrate(analyze(ds), insights(ds));
}

test('a healthy month yields pay-yourself, tax, and runway guidance', () => {
  const n = story({
    taxRate: 0.25,
    bufferMonths: 2,
    openingBalance: { business: 1000 },
    transactions: [
      { date: '2026-01-05', amount: 5000, scope: 'business', description: 'Client invoice' },
      { date: '2026-01-10', amount: -1000, scope: 'business', description: 'AWS' }
    ]
  });
  assert.ok(n.guidance.some((g) => /safely pay yourself/.test(g)));
  assert.ok(n.guidance.some((g) => /Set aside .* for tax/.test(g)));
  assert.ok(n.guidance.some((g) => /runway/.test(g)));
});

test('an unprofitable window is told plainly, not sugar-coated', () => {
  const n = story({
    openingBalance: { business: 500 },
    transactions: [
      { date: '2026-03-01', amount: 1000, scope: 'business', description: 'Client invoice' },
      { date: '2026-03-15', amount: -3000, scope: 'business', description: 'AWS server' }
    ]
  });
  assert.ok(n.guidance.some((g) => /not profitable/.test(g)));
  assert.ok(n.guidance.some((g) => /no business profit/i.test(g)));
});

test('recurring streams and anomalies surface in flow and watch', () => {
  const n = story({
    openingBalance: { business: 5000 },
    transactions: [
      { date: '2026-01-15', amount: -15, scope: 'personal', description: 'Spotify' },
      { date: '2026-02-15', amount: -15, scope: 'personal', description: 'Spotify' },
      { date: '2026-03-15', amount: -15, scope: 'personal', description: 'Spotify' },
      { date: '2026-01-06', amount: -1200, scope: 'personal', description: 'Client software license' }
    ]
  });
  assert.ok(n.flow.some((f) => /Recurring out/.test(f)));
  assert.ok(n.watch.some((w) => /reads like a business item/.test(w)));
});

test('no-burn business reports runway as not a concern', () => {
  const n = story({
    openingBalance: { business: 1000 },
    transactions: [{ date: '2026-02-01', amount: 2000, scope: 'business', description: 'Client invoice' }]
  });
  assert.ok(n.guidance.some((g) => /runway is not a concern/.test(g)));
});
