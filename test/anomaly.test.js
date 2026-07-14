import test from 'node:test';
import assert from 'node:assert/strict';
import { detectAnomalies } from '../src/anomaly.js';

test('a business-looking charge filed under personal is flagged', () => {
  const f = detectAnomalies([
    { date: '2026-01-01', cents: 200000, description: 'Client invoice', scope: 'personal' }
  ]);
  assert.equal(f.length, 1);
  assert.equal(f[0].type, 'scope-mismatch');
  assert.match(f[0].detail, /business/);
});

test('a consistent scope produces no mismatch', () => {
  const f = detectAnomalies([
    { date: '2026-01-01', cents: 200000, description: 'Client invoice', scope: 'business' }
  ]);
  assert.equal(f.filter((x) => x.type === 'scope-mismatch').length, 0);
});

test('a category spike in the latest month is flagged', () => {
  const f = detectAnomalies([
    { date: '2026-01-05', cents: -10000, description: 'Dining out', scope: 'personal' },
    { date: '2026-02-05', cents: -12000, description: 'Dining out', scope: 'personal' },
    { date: '2026-03-05', cents: -50000, description: 'Dining out', scope: 'personal' }
  ]);
  const spike = f.find((x) => x.type === 'category-spike');
  assert.ok(spike);
  assert.match(spike.detail, /dining/);
  assert.match(spike.detail, /higher/);
});

test('a single outsized expense is flagged, normal ones are not', () => {
  const f = detectAnomalies([
    { date: '2026-01-01', cents: -1000, description: 'coffee', scope: 'personal' },
    { date: '2026-01-02', cents: -1000, description: 'coffee', scope: 'personal' },
    { date: '2026-01-03', cents: -1000, description: 'coffee', scope: 'personal' },
    { date: '2026-01-04', cents: -1000, description: 'coffee', scope: 'personal' },
    { date: '2026-01-05', cents: -80000, description: 'Laptop', scope: 'business' }
  ]);
  const large = f.filter((x) => x.type === 'large-expense');
  assert.equal(large.length, 1);
  assert.match(large[0].detail, /Laptop/);
});

test('a steady, consistent month raises no flags', () => {
  const f = detectAnomalies([
    { date: '2026-01-01', cents: -30000, description: 'AWS', scope: 'business' },
    { date: '2026-02-01', cents: -30000, description: 'AWS', scope: 'business' }
  ]);
  assert.equal(f.length, 0);
});
