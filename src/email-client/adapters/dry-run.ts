import { z } from 'zod';

import { Config } from '@/config';
import { Email } from '@/email';
import {
  AuthenticationOutput,
  EmailClient,
  RegisterEmailClient,
  SendEmailOutput,
} from '@/email-client/email-client';

@RegisterEmailClient({
  name: 'dry-run',
  build: ({ config }) => new DryRunEmailClient({ config }),
})
export class DryRunEmailClient extends EmailClient {
  static getConfigSchema() {
    return z.object({
      adapter: z.literal('dry-run'),
      dryRun: z.record(z.unknown()),
    });
  }

  constructor({ config }: DryRunEmailClientOptions) {
    super({ config });
    const configSchema = DryRunEmailClient.getConfigSchema();
    configSchema.parse(config.storage);
  }

  async hasThreadBeenAnswered(threadId: string): Promise<boolean> {
    console.log('Dry-running checking if thread has been answered: ', threadId);
    return false;
  }

  async sendEmail(email: Email): Promise<SendEmailOutput> {
    console.log('Dry-running email sending: ', email);
    return {
      threadId: '__DRY_RUN_THREAD_ID__',
    };
  }

  buildAuthentication(): AuthenticationOutput {
    return {
      buildRequestUrl: () => {
        return '__DRY_RUN_AUTH_URL__';
      },
      handleTokenRedirectRequest: async (request) => {
        console.log('Dry-running token redirect request: ', request.url);
      },
    };
  }
}

export type DryRunEmailClientOptions = { config: Config };
