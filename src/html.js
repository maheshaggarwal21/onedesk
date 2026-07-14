// M5: a self-contained static HTML dashboard. This is the "thin UI" — but as a single
// generated file, not a hosted app: no server, no network, no deploy, so it stays well
// inside the autonomy boundary and opens straight from disk (file://).
//
// SECURITY: transaction descriptions come from user/bank data and are interpolated into
// HTML, so every piece of user-derived text goes through esc(). Encode-on-output is the
// fix for XSS — the exact lesson One Desk's own brain carries, applied to its own build.

import { analyze } from './advisor.js';
import { insights } from './insights.js';
import { narrate } from './narrative.js';
import { monthlyBreakdown } from './monthly.js';
import { fmtCents } from './money.js';

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ESC[c]);
}

const VERDICT_COLOR = {
  HEALTHY: '#1a7f37', STEADY: '#1a7f37', TIGHT: '#9a6700', 'AT RISK': '#cf222e'
};

export function renderHtml(dataset) {
  const a = analyze(dataset);
  const ins = insights(dataset);
  const story = narrate(a, ins);
  const months = monthlyBreakdown(dataset);

  const runway = a.runwayMonths == null ? 'no burn' : `${a.runwayMonths} mo`;
  const vColor = VERDICT_COLOR[a.verdict] || '#57606a';

  const answerCards = `
    <div class="cards">
      <div class="card"><div class="k">Safe to pay yourself</div><div class="v">${fmtCents(a.safeToPayYourself)}</div><div class="s">keeps a ${a.bufferMonths}-mo buffer, tax reserved</div></div>
      <div class="card"><div class="k">Tax to set aside</div><div class="v">${fmtCents(a.taxOwed)}</div><div class="s">${Math.round(a.taxRate * 100)}% of ${fmtCents(a.business.profit)} profit</div></div>
      <div class="card"><div class="k">Runway</div><div class="v">${esc(runway)}</div><div class="s">at current burn</div></div>
    </div>`;

  const catMax = Math.max(1, ...ins.categories.map((c) => c.outCents));
  const catRows = ins.categories.filter((c) => c.outCents > 0).slice(0, 8).map((c) => `
      <div class="row"><span class="lbl">${esc(c.category)}</span><span class="bar"><span style="width:${Math.round((c.outCents / catMax) * 100)}%"></span></span><span class="amt">${fmtCents(c.outCents)}</span></div>`).join('');

  const recurRows = ins.recurring.map((r) => `
      <li><b>${r.direction === 'in' ? '+' : '-'}${fmtCents(r.typicalCents)}</b> ${esc(r.label)} <span class="muted">(${esc(r.scope)}, ${esc(r.cadence)}, ${r.occurrences}x)</span></li>`).join('');

  const anomRows = ins.anomalies.length
    ? ins.anomalies.map((x) => `<li><span class="sev sev-${esc(x.severity)}">${esc(x.severity)}</span> ${esc(x.detail)}</li>`).join('')
    : '<li class="muted">none flagged</li>';

  const guide = story.guidance.map((g) => `<li>${esc(g)}</li>`).join('')
    + story.flow.map((f) => `<li class="muted">${esc(f)}</li>`).join('');
  const watch = story.watch.map((w) => `<li>${esc(w)}</li>`).join('');

  const monthRows = months.map((m) => `
      <tr><td>${esc(m.month)}</td>
        <td class="num">${fmtCents(m.business.net)}</td>
        <td class="num">${fmtCents(m.personal.net)}</td>
        <td>${m.topCategories.map((c) => esc(c.category)).join(', ')}</td></tr>`).join('');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>One Desk — money report</title>
<style>
  :root { color-scheme: light dark; --bg:#fff; --fg:#1f2328; --muted:#57606a; --line:#d0d7de; --card:#f6f8fa; --accent:#0969da; }
  @media (prefers-color-scheme: dark) { :root { --bg:#0d1117; --fg:#e6edf3; --muted:#8b949e; --line:#30363d; --card:#161b22; --accent:#58a6ff; } }
  * { box-sizing: border-box; }
  body { margin:0; padding:2rem 1rem; background:var(--bg); color:var(--fg); font:15px/1.5 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif; }
  .wrap { max-width: 820px; margin: 0 auto; }
  h1 { font-size:1.4rem; margin:0 0 .25rem; }
  .period { color:var(--muted); margin-bottom:1rem; }
  .verdict { display:inline-block; padding:.15rem .6rem; border-radius:999px; color:#fff; font-weight:600; font-size:.85rem; }
  .cards { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:.75rem; margin:1rem 0 1.5rem; }
  .card { background:var(--card); border:1px solid var(--line); border-radius:10px; padding:1rem; }
  .card .k { color:var(--muted); font-size:.8rem; text-transform:uppercase; letter-spacing:.03em; }
  .card .v { font-size:1.5rem; font-weight:700; margin:.2rem 0; }
  .card .s { color:var(--muted); font-size:.82rem; }
  h2 { font-size:1rem; margin:1.5rem 0 .5rem; border-bottom:1px solid var(--line); padding-bottom:.3rem; }
  .row { display:flex; align-items:center; gap:.6rem; margin:.3rem 0; }
  .row .lbl { width:130px; }
  .row .bar { flex:1; background:var(--card); border-radius:4px; height:12px; overflow:hidden; }
  .row .bar span { display:block; height:100%; background:var(--accent); }
  .row .amt { width:100px; text-align:right; font-variant-numeric:tabular-nums; }
  ul { padding-left:1.1rem; margin:.4rem 0; }
  li { margin:.25rem 0; }
  .muted { color:var(--muted); }
  .sev { font-size:.72rem; text-transform:uppercase; padding:0 .35rem; border-radius:4px; border:1px solid var(--line); }
  .sev-medium { color:#9a6700; } .sev-low { color:var(--muted); } .sev-high { color:#cf222e; }
  table { width:100%; border-collapse:collapse; margin-top:.4rem; }
  th,td { text-align:left; padding:.35rem .5rem; border-bottom:1px solid var(--line); }
  th { color:var(--muted); font-weight:600; font-size:.8rem; }
  td.num { text-align:right; font-variant-numeric:tabular-nums; }
  footer { color:var(--muted); font-size:.8rem; margin-top:2rem; }
</style>
</head>
<body>
  <div class="wrap">
    <h1>One Desk</h1>
    <div class="period">${esc(a.period.from || '?')} to ${esc(a.period.to || '?')} · ${a.period.months} month${a.period.months === 1 ? '' : 's'} · <span class="verdict" style="background:${vColor}">${esc(a.verdict)}</span></div>
    ${answerCards}

    <h2>Business vs personal</h2>
    <div class="muted">Business: income ${fmtCents(a.business.income)} · expenses ${fmtCents(a.business.expense)} · profit ${fmtCents(a.business.profit)} · cash ${fmtCents(a.business.cash)}<br>Personal: income ${fmtCents(a.personal.income)} · expenses ${fmtCents(a.personal.expense)} · net ${fmtCents(a.personal.net)}</div>

    <h2>Spend by category</h2>
    ${catRows || '<div class="muted">no spend</div>'}

    <h2>Recurring</h2>
    <ul>${recurRows || '<li class="muted">none detected</li>'}</ul>

    <h2>Anomalies</h2>
    <ul>${anomRows}</ul>

    <h2>Guidance</h2>
    <ul>${guide}</ul>
    ${watch ? `<h2>Watch</h2><ul>${watch}</ul>` : ''}

    <h2>By month</h2>
    <table><thead><tr><th>Month</th><th class="num">Business net</th><th class="num">Personal net</th><th>Top spend</th></tr></thead>
      <tbody>${monthRows}</tbody></table>

    <footer>Generated by One Desk. All figures computed locally from your transactions; nothing left your machine.</footer>
  </div>
</body>
</html>
`;
}
