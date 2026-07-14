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

**M3 — advisor narrative + monthly report, shipped.** `onedesk report` now ends with
plain-language guidance ("you can safely pay yourself $X…"), and `onedesk monthly` gives a
per-month business/personal breakdown. 50 tests, pure functions, zero runtime dependencies.

- [x] **M1** — money core + advisor (`onedesk report`): transaction model, personal/business
      split, tax set-aside, safe-to-pay-yourself, and runway. Pure functions, `node:test`,
      CLI over a JSON/CSV file.
- [x] **M2** — categorization + recurring detection + anomaly flags: spend by category,
      repeating charges (subscriptions/salary/rent) as monthly or irregular streams, and three
      anomaly checks — business-expense-in-a-personal-account, category spikes, and outsized
      one-off expenses. Tuned for low false positives.
- [x] **M3** — advisor narrative (`report` GUIDANCE/WATCH sections: deterministic plain-language
      advice, no LLM) + `onedesk monthly` per-month breakdown with top categories.
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

The same report also breaks down spend by category, lists recurring charges, and raises
anomaly flags. Try `onedesk report examples/sample-messy.json` to see the flags fire — a
business charge filed under personal, a dining spike, and outsized one-off expenses:

```
  ANOMALIES
    [medium] "Client project software license" reads like a business item but is filed under personal.
    [medium] dining spending was 445% higher in 2026-06 than the prior-month average.
```

## Usage

```
node bin/onedesk.js help
node bin/onedesk.js report  [transactions.json]  # money answers + spend + recurring + anomalies + guidance
node bin/onedesk.js monthly [transactions.json]  # per-month business/personal breakdown
```

Add `--json` for raw output, `--tax <rate>` / `--buffer <months>` to override assumptions.

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
