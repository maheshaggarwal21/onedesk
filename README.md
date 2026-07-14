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

**M0 — scaffold.** `onedesk` runs; the money engine is the next build.

- [ ] **M1** — money core + advisor (library + `onedesk report`): transaction model,
      personal/business split, rules engine, and the advisor (safe-to-pay-yourself, tax
      set-aside owed to date, runway). Pure functions, `node:test`, CLI over a sample file.
- [ ] **M2** — categorization + recurring detection + anomaly flags
- [ ] **M3** — advisor narrative + monthly report (plain-language guidance)
- [ ] **M4** — bank-CSV import adapters + local file store
- [ ] **M5** — thin local UI (deferred; hosting/deploy is not automated)

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
