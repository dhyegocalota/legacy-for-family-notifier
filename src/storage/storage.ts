import { Config } from '@/config';
import { EmailClientCredentials } from '@/email-client';
import { Notification } from '@/notification/notification';

export interface Storage {
  getNotification(): Promise<Notification | null>;

  saveNotification(notification: Notification): Promise<void>;

  getEmailClientCredentials(
    adapter: string,
  ): Promise<EmailClientCredentials | null>;

  saveEmailClientCredentials(
    adapter: string,
    credentials: EmailClientCredentials,
  ): Promise<void>;
}

export type StorageBuilder = ({ config }: { config: Config }) => Storage;

const storages: Map<string, StorageBuilder> = new Map();

export const RegisterStorage = ({
  name,
  build,
}: {
  name: string;
  build: StorageBuilder;
}) => {
  return (_: Function) => {
    if (storages.has(name)) {
      throw new Error(`Email client ${name} already registered`);
    }

    storages.set(name, build);
  };
};

export const getStorageByConfig = (config: Config): Storage => {
  const name = config.storage.adapter;
  const builder = storages.get(name);

  if (!builder) {
    throw new Error(`Storage adapter ${name} not registered`);
  }

  return builder({ config });
};
