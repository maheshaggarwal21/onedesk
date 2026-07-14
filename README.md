# One Desk

Know what's actually yours. If you run personal and business money through the same or
overlapping accounts — freelancers, solo founders, tiny businesses — the balance in your
account lies to you. Some of it is owed to tax, some is real business cost, some is float
the business needs to survive. One Desk is a money engine and advisor that answers the
three questions those apps never do:

1. **What's really mine to spend** — after tax, costs, and business float?
2. **How much can I safely pay myself this month** — after tax set-aside, upcoming bills,
   and a runway buffer?
3. **How long is my runway** — months of survival at current burn?

Personal-finance apps don't separate business from personal. Bookkeeping tools are built
for accountants, not for the "what's really mine" question. One Desk fills that gap.

## Status

**M1 — money core + advisor, shipped.** `onedesk report` answers the three questions over a
transactions file (JSON or CSV). 28 tests, pure functions, zero runtime dependencies.

- [x] **M1** — money core + advisor (`onedesk report`): transaction model, personal/business
      split, tax set-aside, safe-to-pay-yourself, and runway. Pure functions, `node:test`,
      CLI over a JSON/CSV file.
- [ ] **M2** — categorization + recurring detection + anomaly flags
- [ ] **M3** — advisor narrative + monthly report (plain-language guidance)
- [ ] **M4** — bank-CSV import adapters + local file store
- [ ] **M5** — thin local UI (deferred; hosting/deploy is not automated)

## Example

`onedesk report examples/sample-transactions.json` on a freelancer's quarter:

```
ONE DESK - money report
  period: 2026-04-02 to 2026-06-12  (3 months)     VERDICT: HEALTHY

  THE THREE ANSWERS
    safe to pay yourself:  $17,103.50   (after tax reserve + a 3-month buffer)
    tax to set aside:      $3,800.50   (25% of $15,202.00 business profit)
    runway:                25.3 months
```

Every headline number shows the assumption behind it, and transactions it can't confidently
place as business or personal are flagged, not silently folded into the math.

## Usage

```
node bin/onedesk.js help
node bin/onedesk.js report [transactions.json]   # the advisor report (M1)
```

Node ≥ 18. No runtime dependencies; the core runs fully offline. Your financial data
never leaves your machine.

## Run the tests

```
npm test
```

## Design notes

- Node ESM, `node:test` only — no test framework, no runtime dependencies for the core.
- The money engine is pure functions over an injected transaction list, so the whole
  advisor is deterministic and testable without a disk, a network, or a real bank export.
- Local-first and privacy-first by construction: financial data is the most sensitive
  data a person has, so it stays on-device.

## License

MIT.
