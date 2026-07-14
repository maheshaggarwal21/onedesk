import test from 'node:test';
import assert from 'node:assert/strict';
import { detectRecurring } from '../src/recurring.js';

const mk = (date, cents, description, scope = 'personal') => ({ date, cents, description, scope });

test('a monthly subscription is detected as one monthly stream', () => {
  const s = detectRecurring([
    mk('2026-01-10', -1500, 'Netflix'),
    mk('2026-02-10', -1500, 'Netflix'),
    mk('2026-03-10', -1500, 'Netflix')
  ]);
  assert.equal(s.length, 1);
  assert.equal(s[0].cadence, 'monthly');
  assert.equal(s[0].occurrences, 3);
  assert.equal(s[0].typicalCents, 1500);
  assert.equal(s[0].direction, 'out');
  assert.equal(s[0].scope, 'personal');
  assert.equal(s[0].label, 'Netflix');
});

test('a single occurrence is not recurring', () => {
  assert.equal(detectRecurring([mk('2026-01-10', -1500, 'Netflix')]).length, 0);
});

test('two charges in the same month are not recurring', () => {
  const s = detectRecurring([mk('2026-01-05', -1500, 'Netflix'), mk('2026-01-20', -1500, 'Netflix')]);
  assert.equal(s.length, 0);
});

test('an inconsistent amount is not treated as one stream', () => {
  const s = detectRecurring([
    mk('2026-01-10', -1500, 'Shopping'),
    mk('2026-02-10', -1500, 'Shopping'),
    mk('2026-03-10', -5000, 'Shopping')
  ]);
  assert.equal(s.length, 0); // spread too wide
});

test('a skipped month makes the stream irregular, not monthly', () => {
  const s = detectRecurring([mk('2026-01-10', -1500, 'Gym'), mk('2026-03-10', -1500, 'Gym')]);
  assert.equal(s.length, 1);
  assert.equal(s[0].cadence, 'irregular');
});

test('digits and reference numbers collapse to one payee', () => {
  const s = detectRecurring([
    mk('2026-01-05', -30000, 'AWS #4821', 'business'),
    mk('2026-02-05', -30000, 'AWS #5533', 'business')
  ]);
  assert.equal(s.length, 1);
  assert.equal(s[0].occurrences, 2);
});

test('transactions with no description are skipped, not mis-grouped', () => {
  const s = detectRecurring([mk('2026-01-05', -100, ''), mk('2026-02-05', -100, '')]);
  assert.equal(s.length, 0);
});
