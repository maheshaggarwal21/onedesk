import test from 'node:test';
import assert from 'node:assert/strict';
import { toCents, toDollars, fmtCents, normalizeRate } from '../src/money.js';

test('toCents rounds dollars to integer cents', () => {
  assert.equal(toCents(0.1), 10);
  assert.equal(toCents(19.99), 1999);
  assert.equal(toCents(-5), -500);
  assert.equal(toCents(0.005), 1); // rounds up at half a cent
});

test('cents math does not drift where float dollars would', () => {
  // 0.1 + 0.2 !== 0.3 in floats; in cents it is exact.
  assert.notEqual(0.1 + 0.2, 0.3);
  assert.equal(toCents(0.1) + toCents(0.2), toCents(0.3));
});

test('toDollars is the inverse for interchange', () => {
  assert.equal(toDollars(1999), 19.99);
});

test('fmtCents formats sign, dollars, thousands, and cents', () => {
  assert.equal(fmtCents(0), '$0.00');
  assert.equal(fmtCents(5), '$0.05');
  assert.equal(fmtCents(100), '$1.00');
  assert.equal(fmtCents(123456), '$1,234.56');
  assert.equal(fmtCents(-50), '-$0.50');
  assert.equal(fmtCents(-123456), '-$1,234.56');
});

test('normalizeRate accepts fractions and percentages, clamps garbage', () => {
  assert.equal(normalizeRate(0.25), 0.25);
  assert.equal(normalizeRate(25), 0.25);
  assert.equal(normalizeRate('0.3'), 0.3);
  assert.equal(normalizeRate(-1), 0);
  assert.equal(normalizeRate('abc'), 0);
  assert.equal(normalizeRate(150), 1); // >100% clamps to 1
});
