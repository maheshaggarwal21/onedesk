// Small date helpers over ISO "YYYY-MM-DD" strings. Kept pure and string-based so
// nothing depends on the wall clock or a timezone (which would make tests flaky).

// A sortable, subtractable month number: 2026-03 -> 24315. Difference = months apart.
export function monthIndex(dateStr) {
  const [y, m] = dateStr.split('-').map(Number);
  return y * 12 + (m - 1);
}

// The year-month bucket key: "2026-03-15" -> "2026-03".
export function monthKey(dateStr) {
  return dateStr.slice(0, 7);
}
