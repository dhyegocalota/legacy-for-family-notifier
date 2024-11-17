import { AuthenticateCommand } from '@/commands/authenticate';
import { DryRunCommand } from '@/commands/dry-run';
import { RunCommand } from '@/commands/run';

const COMMANDS = {
  authenticate: AuthenticateCommand,
  'dry-run': DryRunCommand,
  run: RunCommand,
};

export default COMMANDS;
export { AuthenticateCommand, DryRunCommand, RunCommand };
