// Deterministic spend categorization. A transaction is placed in exactly one bucket
// by the first matching rule, so the result is stable and explainable (no ML, no
// probabilities). An input transaction that already carries a known bucket name in
// its `category` field keeps it; otherwise we infer from description + category text.
//
// Rules are ordered most-specific first. The catch-all is "income-other" for money in
// and "other" for money out, so every transaction lands somewhere.

const CATEGORY_RULES = [
  ['income', /\b(invoice|client|retainer|payout|salary|paycheck|wages|revenue|\bsale\b)\b/i],
  ['hosting', /\b(aws|gcp|azure|heroku|vercel|netlify|hosting|server|domain|cloudflare)\b/i],
  ['software', /\b(saas|subscription|license|github|figma|notion|slack|adobe|jetbrains|openai)\b/i],
  ['contractor', /\b(contractor|freelanc\w*|upwork|fiverr|payroll)\b/i],
  ['office', /\b(coworking|wework|office supplies|equipment|stationery)\b/i],
  ['housing', /\b(rent|mortgage|lease|landlord)\b/i],
  ['groceries', /\b(grocer\w*|supermarket|whole foods|trader joe)\b/i],
  ['dining', /\b(restaurant|dining|cafe|coffee|starbucks|uber eats|doordash|swiggy|zomato)\b/i],
  ['utilities', /\b(electric\w*|water bill|gas bill|internet|broadband|utilit\w*|phone bill)\b/i],
  ['transport', /\b(uber|lyft|fuel|petrol|gas station|transit|parking|flight|airline)\b/i],
  ['entertainment', /\b(netflix|spotify|hulu|disney|prime video|youtube premium|\bgame\b)\b/i],
  ['insurance', /\b(insurance|premium)\b/i],
  ['tax', /\b(\btax\b|irs|gst|vat)\b/i],
  ['transfer', /\b(atm|withdrawal|deposit|transfer)\b/i]
];

export const KNOWN_CATEGORIES = new Set([...CATEGORY_RULES.map((r) => r[0]), 'income-other', 'other']);

export function categorize(txn) {
  if (txn.category && KNOWN_CATEGORIES.has(txn.category)) return txn.category;
  const text = `${txn.description || ''} ${txn.category || ''}`;
  for (const [cat, re] of CATEGORY_RULES) {
    if (re.test(text)) return cat;
  }
  return txn.cents > 0 ? 'income-other' : 'other';
}

// Roll up spend by category: one row per category with counts and in/out totals,
// sorted by outflow (spend) descending so the biggest costs surface first.
export function categorySummary(txns) {
  const rows = new Map();
  for (const t of txns) {
    const cat = categorize(t);
    if (!rows.has(cat)) rows.set(cat, { category: cat, count: 0, inCents: 0, outCents: 0 });
    const r = rows.get(cat);
    r.count += 1;
    if (t.cents >= 0) r.inCents += t.cents;
    else r.outCents += -t.cents;
  }
  return [...rows.values()].sort((a, b) => b.outCents - a.outCents || b.inCents - a.inCents);
}
