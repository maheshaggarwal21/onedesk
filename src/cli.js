// One Desk CLI. This is the M0 scaffold — the M1 build (money core + advisor)
// wires real commands here. Kept deliberately thin so `onedesk` runs today and
// the next task fills in the finance engine behind these verbs.

const COMMANDS = {
  report: async () => {
    console.log('One Desk — scaffold in place. M1 (money core + advisor) is the next build.');
    return 0;
  }
};

export async function run(argv) {
  const [cmd = 'help'] = argv;

  if (cmd === 'help' || cmd === '--help' || cmd === '-h') {
    console.log('onedesk — a personal + business money engine & advisor\n');
    console.log('  onedesk report [transactions.json]   safe-to-pay-yourself, tax set-aside, runway  (M1, coming)');
    console.log('\nStatus: M0 scaffold. Node >= 18, zero runtime dependencies, runs offline.');
    return 0;
  }

  const fn = COMMANDS[cmd];
  if (!fn) {
    console.error(`onedesk: unknown command "${cmd}" — try \`onedesk help\``);
    return 1;
  }
  return fn(argv.slice(1));
}
