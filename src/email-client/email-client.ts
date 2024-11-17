import * as http from 'http';

import { Config } from '@/config';
import { Email } from '@/email';
import { Storage, getStorageByConfig } from '@/storage';

export abstract class EmailClient {
  protected readonly config: Config;
  protected readonly storage: Storage;

  protected constructor({ config }: EmailClientOptions) {
    this.config = config;
    this.storage = getStorageByConfig(config);
  }

  abstract hasThreadBeenAnswered(threadId: string): Promise<boolean>;

  abstract sendEmail(email: Email): Promise<SendEmailOutput>;

  abstract buildAuthentication({
    redirectUri,
  }: AuthenticationInput): AuthenticationOutput;
}

export type EmailClientOptions = { config: Config };

export type SendEmailOutput = {
  threadId: string;
};

export type AuthenticationInput = {
  redirectUri: string;
};

export type AuthenticationOutput = {
  buildRequestUrl: () => string;
  handleTokenRedirectRequest: (request: http.IncomingMessage) => Promise<void>;
};

export type EmailClientCredentials = Record<string, unknown>;

export type EmailClientBuilder = ({
  config,
}: {
  config: Config;
}) => EmailClient;

const emailClients: Map<string, EmailClientBuilder> = new Map();

export const RegisterEmailClient = ({
  name,
  build,
}: {
  name: string;
  build: EmailClientBuilder;
}) => {
  return (_: Function) => {
    if (emailClients.has(name)) {
      throw new Error(`Email client ${name} already registered`);
    }

    emailClients.set(name, build);
  };
};

export const getEmailClientByConfig = (config: Config): EmailClient => {
  const name = config.emailClient.adapter;
  const builder = emailClients.get(name);

  if (!builder) {
    throw new Error(`Email client ${name} not registered`);
  }

  return builder({ config });
};
