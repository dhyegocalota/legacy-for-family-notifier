import { Command, Flags } from '@oclif/core';

import { Config, loadConfig } from '@/config';
import { Notificator } from '@/notificator';

export class DryRunCommand extends Command {
  static description = 'Perform a dry run of the notification process';

  static flags = {
    'config-file': Flags.string({
      description: 'Path to configuration file',
      required: false,
    }),
  };

  async run(): Promise<void> {
    this.log('Dry-running notification process...');
    const notificator = await this.buildNotificator();
    const notification = await notificator.notify();
    this.log('Dry-running process completed', notification);
    this.exit(0);
  }

  private async buildNotificator(): Promise<Notificator> {
    const config = await this.buildConfig();
    return new Notificator({ config });
  }

  private async buildConfig(): Promise<Config> {
    const { flags } = await this.parse(DryRunCommand);
    const config = await loadConfig({
      configFilePath: flags['config-file'],
    });

    return {
      ...config,
      emailClient: {
        adapter: 'dry-run',
        dryRun: config.emailClient,
      },
      storage: {
        adapter: 'dry-run',
        dryRun: config.storage,
      },
    };
  }
}
