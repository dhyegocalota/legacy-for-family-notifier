import { Command, Flags } from '@oclif/core';
import localtunnel from 'localtunnel';

import { Config, loadConfig } from '@/config';
import { Notificator } from '@/notificator';

export class AuthenticateCommand extends Command {
  static description =
    'Authenticate required services to enable the application to function';

  static flags = {
    'config-file': Flags.string({
      description: 'Path to configuration file',
      required: false,
    }),
  };

  async run(): Promise<void> {
    this.log('Authenticating services...');
    const notificator = await this.buildNotificator();
    await notificator.authenticate({
      onServerAddress: async (address) => {
        if (!process.env.RENDER) {
          return;
        }

        this.log(
          '\n\nWe detected you are running on Render. We will create a tunnel for you so that you can authenticate.',
        );

        const tunnel = await localtunnel({ port: address.port });
        this.log(
          'After you are redirected back to the localhost URL, copy the `code` query parameter and paste in the following URL: ',
          `${tunnel.url}/?code=YOUR_CODE_HERE`,
        );
      },
      onRequestUrl: (url) => {
        this.log('Please visit the following URL to authenticate:', url);
      },
    });
    this.log('Authentication process done');
    this.exit(0);
  }

  private async buildNotificator(): Promise<Notificator> {
    const config = await this.buildConfig();
    return new Notificator({ config });
  }

  private async buildConfig(): Promise<Config> {
    const { flags } = await this.parse(AuthenticateCommand);
    return loadConfig({
      configFilePath: flags['config-file'],
    });
  }
}
