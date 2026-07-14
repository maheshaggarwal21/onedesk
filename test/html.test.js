import test from 'node:test';
import assert from 'node:assert/strict';
import { loadDataset } from '../src/model.js';
import { renderHtml } from '../src/html.js';

const sample = {
  taxRate: 0.25,
  bufferMonths: 2,
  openingBalance: { business: 1000 },
  transactions: [
    { date: '2026-01-05', amount: 5000, scope: 'business', description: 'Client invoice' },
    { date: '2026-01-10', amount: -1000, scope: 'business', description: 'AWS' },
    { date: '2026-01-12', amount: -500, scope: 'personal', description: 'Groceries' }
  ]
};

test('renderHtml produces a well-formed self-contained document', () => {
  const h = renderHtml(loadDataset(sample));
  assert.ok(h.startsWith('<!doctype html'));
  assert.ok(h.includes('</html>'));
  assert.ok(h.includes('<style>')); // styles are inline (self-contained)
  assert.ok(!/https?:\/\//.test(h)); // no external resources
});

test('renderHtml shows the key figures and verdict', () => {
  const h = renderHtml(loadDataset(sample));
  assert.ok(h.includes('Safe to pay yourself'));
  assert.ok(h.includes('$2,000.00')); // safe-to-pay for this dataset
  assert.ok(h.includes('STEADY'));
  assert.ok(h.includes('hosting')); // a category
});

test('renderHtml escapes user-supplied text (no XSS from a bank description)', () => {
  // two occurrences so the description surfaces as a recurring label (a rendered path)
  const h = renderHtml(loadDataset({
    transactions: [
      { date: '2026-01-01', amount: -100, scope: 'personal', description: '<script>alert(1)</script>' },
      { date: '2026-02-01', amount: -100, scope: 'personal', description: '<script>alert(1)</script>' }
    ]
  }));
  assert.ok(h.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
  assert.ok(!h.includes('<script>alert(1)</script>'));
});
