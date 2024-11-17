import { z } from 'zod';

import { Config, StorageConfig } from '@/config';
import { EmailClientCredentials } from '@/email-client';
import { Notification } from '@/notification';
import {
  RegisterStorage,
  Storage,
  getStorageByConfig,
} from '@/storage/storage';

@RegisterStorage({
  name: 'dry-run',
  build: ({ config }) => new DryRunStorage({ config }),
})
export class DryRunStorage implements Storage {
  static getConfigSchema() {
    return z.object({
      adapter: z.literal('dry-run'),
      dryRun: z.record(z.unknown()),
    });
  }

  private readonly config: DryRunConfig;
  private storage: Storage | null = null;

  constructor({ config }: DryRunStorageOptions) {
    const configSchema = DryRunStorage.getConfigSchema();
    configSchema.parse(config.storage);
    this.config = config as DryRunConfig;
  }

  getNotification(): Promise<Notification | null> {
    const storage = this.getOrBuildStorage();
    return storage.getNotification();
  }

  private getOrBuildStorage(): Storage {
    if (!this.storage) {
      this.storage = getStorageByConfig({
        ...this.config,
        storage: this.config.storage.dryRun,
      });
    }
    return this.storage;
  }

  async saveNotification(notification: Notification): Promise<void> {
    console.log(
      'Dry-running saveNotification with notification:',
      notification,
    );
  }

  async getEmailClientCredentials(
    adapter: string,
  ): Promise<EmailClientCredentials | null> {
    const storage = this.getOrBuildStorage();
    return storage.getEmailClientCredentials(adapter);
  }

  async saveEmailClientCredentials(
    adapter: string,
    credentials: EmailClientCredentials,
  ): Promise<void> {
    console.log(
      'Dry-running saveEmailClientCredentials with adapter:',
      adapter,
      'and credentials:',
      credentials,
    );
  }
}

export type DryRunStorageOptions = { config: Config };

type DryRunConfig = Config & {
  storage: { adapter: 'dry-run'; dryRun: StorageConfig };
};
