// Personal vs business is the whole point of One Desk, so scope resolution is
// deliberate and conservative. Order of trust:
//   1. an explicit `scope` on the transaction  (the user said so)
//   2. an `account` of "business"/"personal"    (which account it hit)
//   3. a keyword guess from description+category (a hint, not a fact)
//   4. otherwise "unclassified" — we DO NOT guess wrong to look tidy.
//
// Unclassified transactions are surfaced loudly and excluded from the money math,
// because silently folding them in would bias the advice (usually optimistically),
// and optimistic money advice is dangerous. Better to say "classify these first".

const BUSINESS_HINTS = /\b(invoice|client|consult(?:ing)?|retainer|payout|freelance|contractor|payroll|saas|hosting|domain|server|aws|gcp|azure|stripe|office|b2b|wholesale)\b/i;
const PERSONAL_HINTS = /\b(groceries|grocery|netflix|spotify|dining|restaurant|cafe|coffee|gym|mortgage|utilities|electricity|paycheck|salary|allowance|clothes|entertainment)\b/i;

const VALID = new Set(['business', 'personal']);

export function inferScope(raw) {
  if (VALID.has(raw.scope)) return raw.scope;
  if (VALID.has(raw.account)) return raw.account;
  const text = `${raw.description || ''} ${raw.category || ''}`;
  if (BUSINESS_HINTS.test(text)) return 'business';
  if (PERSONAL_HINTS.test(text)) return 'personal';
  return 'unclassified';
}

// Group already-normalized transactions by resolved scope.
export function groupByScope(txns) {
  const groups = { business: [], personal: [], unclassified: [] };
  for (const t of txns) (groups[t.scope] || groups.unclassified).push(t);
  return groups;
}
