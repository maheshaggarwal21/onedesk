// One Desk CLI. M1 wires the `report` command (money engine + advisor) over a
// transactions file. More verbs (import, categorize, monthly) arrive in later
// milestones behind this same dispatch.

import report from './commands/report.js';
import monthly from './commands/monthly.js';

const COMMANDS = {
  report,
  monthly
};

function help() {
  console.log('onedesk - a personal + business money engine & advisor\n');
  console.log('  onedesk report [file]    safe-to-pay-yourself, tax set-aside, runway, spend,');
  console.log('                           recurring, anomalies, and plain-language guidance');
  console.log('  onedesk monthly [file]   per-month business/personal breakdown + top categories');
  console.log('                           file: transactions JSON or CSV (default: transactions.json)');
  console.log('                           flags: --json  --tax <rate>  --buffer <months>');
  console.log('\nNode >= 18, zero runtime dependencies, runs fully offline.');
}

export async function run(argv) {
  const [cmd = 'help'] = argv;
  if (cmd === 'help' || cmd === '--help' || cmd === '-h') {
    help();
    return 0;
  }
  const fn = COMMANDS[cmd];
  if (!fn) {
    console.error(`onedesk: unknown command "${cmd}" - try \`onedesk help\``);
    return 1;
  }
  return fn(argv.slice(1));
}
