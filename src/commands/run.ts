import { Command, Flags } from '@oclif/core';

import { Config, loadConfig } from '@/config';
import { Notificator } from '@/notificator';

export class RunCommand extends Command {
  static description = 'Run the notification process';

  static flags = {
    'config-file': Flags.string({
      description: 'Path to configuration file',
      required: false,
    }),
  };

  async run(): Promise<void> {
    this.log('Running notification process...');
    const notificator = await this.buildNotificator();
    const notification = await notificator.notify();
    this.log('Notification process done', notification);
    this.exit(0);
  }

  private async buildNotificator(): Promise<Notificator> {
    const config = await this.buildConfig();
    return new Notificator({ config });
  }

  private async buildConfig(): Promise<Config> {
    const { flags } = await this.parse(RunCommand);
    return loadConfig({
      configFilePath: flags['config-file'],
    });
  }
}
