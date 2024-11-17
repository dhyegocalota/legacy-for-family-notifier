import Redis from 'ioredis';
import { z } from 'zod';

import { Config } from '@/config/config';
import { EmailClientCredentials } from '@/email-client';
import { Notification } from '@/notification/notification';
import { RegisterStorage, Storage } from '@/storage/storage';

@RegisterStorage({
  name: 'redis',
  build: ({ config }) => new RedisStorage({ config }),
})
export class RedisStorage implements Storage {
  public static readonly NOTIFICATION_KEY = 'notification';
  public static readonly EMAIL_CLIENT_TOKEN_KEY = 'email-client-token/:adapter';

  static getConfigSchema() {
    return z.object({
      adapter: z.literal('redis'),
      redis: z.object({
        host: z.string(),
        port: z.number(),
      }),
    });
  }

  private readonly config: {
    adapter: 'redis';
    redis: {
      host: string;
      port: number;
    };
  };

  private readonly redis: Redis;

  constructor({ config }: RedisStorageOptions) {
    const configSchema = RedisStorage.getConfigSchema();
    this.config = configSchema.parse(config.storage);
    this.redis = new Redis(this.config.redis);
  }

  async getNotification(): Promise<Notification | null> {
    const notification = await this.redis.get(RedisStorage.NOTIFICATION_KEY);

    if (!notification) {
      return null;
    }

    const parsedNotification = JSON.parse(notification);

    return {
      ...parsedNotification,
      startedAt: new Date(parsedNotification.startedAt),
      lastSequenceSentAt: parsedNotification.lastSequenceSentAt
        ? new Date(parsedNotification.lastSequenceSentAt)
        : undefined,
    };
  }

  async saveNotification(notification: Notification): Promise<void> {
    await this.redis.set(
      RedisStorage.NOTIFICATION_KEY,
      JSON.stringify(notification),
    );
  }

  async getEmailClientCredentials(
    adapter: string,
  ): Promise<EmailClientCredentials | null> {
    const token = await this.redis.get(
      RedisStorage.EMAIL_CLIENT_TOKEN_KEY.replace(':adapter', adapter),
    );

    if (!token) {
      return null;
    }

    return JSON.parse(token);
  }

  async saveEmailClientCredentials(
    adapter: string,
    credentials: EmailClientCredentials,
  ): Promise<void> {
    await this.redis.set(
      RedisStorage.EMAIL_CLIENT_TOKEN_KEY.replace(':adapter', adapter),
      JSON.stringify(credentials),
    );
  }
}

export type RedisStorageOptions = { config: Config };
