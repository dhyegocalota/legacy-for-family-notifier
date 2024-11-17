import type googleTypes from 'googleapis';
import { google } from 'googleapis';
import { URL } from 'url';
import { z } from 'zod';

import { Config } from '@/config/config';
import { Email, buildEmailBody, buildEmailSubject } from '@/email';
import {
  AuthenticationInput,
  AuthenticationOutput,
  EmailClient,
  EmailClientCredentials,
  RegisterEmailClient,
  SendEmailOutput,
} from '@/email-client/email-client';

@RegisterEmailClient({
  name: GmailEmailClient.ADAPTER_NAME,
  build: (options: GmailEmailClientOptions) => new GmailEmailClient(options),
})
export class GmailEmailClient extends EmailClient {
  static readonly ADAPTER_NAME = 'gmail';
  static readonly SCOPES = [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.readonly',
  ];

  static getGmailConfigSchema() {
    return z.object({
      adapter: z.literal(GmailEmailClient.ADAPTER_NAME),
      gmail: z.object({
        clientId: z.string(),
        clientSecret: z.string(),
      }),
    });
  }

  private readonly gmailConfig: {
    adapter: typeof GmailEmailClient.ADAPTER_NAME;
    gmail: {
      clientId: string;
      clientSecret: string;
    };
  };

  constructor({ config }: GmailEmailClientOptions) {
    super({ config });
    const configSchema = GmailEmailClient.getGmailConfigSchema();
    this.gmailConfig = configSchema.parse(config.emailClient);
  }

  async hasThreadBeenAnswered(threadId: string): Promise<boolean> {
    const credentials = await this.getActiveCredentials();
    const oauth2Client = this.buildOAuth2Client(credentials);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const thread = await gmail.users.threads.get({
      userId: 'me',
      id: threadId,
    });

    if (!thread.data.messages || thread.data.messages.length === 0) {
      return false;
    }

    const firstSenderEmailAddress = this.getSenderEmailAddressFromMessage(
      thread.data.messages[0],
    );

    if (!firstSenderEmailAddress) {
      throw new Error(
        `Sender email address not found: ${JSON.stringify(thread.data.messages[0])}`,
      );
    }

    const messagesFromRecipients = thread.data.messages.filter(
      (message) =>
        this.getSenderEmailAddressFromMessage(message) !==
        firstSenderEmailAddress,
    );

    return messagesFromRecipients.length > 0;
  }

  private getSenderEmailAddressFromMessage(
    message: googleTypes.gmail_v1.Schema$Message,
  ): string | null {
    return (
      message.payload?.headers?.find((header) => header.name === 'From')
        ?.value ?? null
    );
  }

  async sendEmail(email: Email): Promise<SendEmailOutput> {
    const credentials = await this.getActiveCredentials();
    const rawEmail = this.buildRawEmail(email);
    const oauth2Client = this.buildOAuth2Client(credentials);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const message = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        threadId: email.threadId,
        raw: rawEmail,
      },
    });

    return { threadId: message.data.threadId! };
  }

  private buildRawEmail(email: Email): string {
    const rawEmail = `From: ${email.senderEmailAddress}
To: ${email.recipientEmailAddress}
Subject: ${buildEmailSubject(email)}
Content-Type: text/plain; charset=utf-8

${buildEmailBody(email)}`;

    return this.encodeRawEmail(rawEmail);
  }

  private encodeRawEmail(rawEmail: string): string {
    return Buffer.from(rawEmail)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  private async getActiveCredentials(): Promise<EmailClientCredentials> {
    const credentials = await this.storage.getEmailClientCredentials(
      GmailEmailClient.ADAPTER_NAME,
    );

    if (!credentials) {
      throw new Error('Gmail credentials not found');
    }

    let activeCredentials = credentials as GmailEmailClientCredentials;
    const isExpired = Date.now() >= activeCredentials.expiry_date;

    if (isExpired) {
      activeCredentials = await this.refreshCredentials(activeCredentials);
    }

    return this.checkCredentials(activeCredentials);
  }

  private async refreshCredentials(
    credentials: GmailEmailClientCredentials,
  ): Promise<GmailEmailClientCredentials> {
    const oauth2Client = this.buildOAuth2Client({
      refresh_token: credentials.refresh_token,
    });

    const { credentials: refreshedCredentials } =
      await oauth2Client.refreshAccessToken();

    await this.storage.saveEmailClientCredentials(
      GmailEmailClient.ADAPTER_NAME,
      refreshedCredentials as Record<string, unknown>,
    );

    return refreshedCredentials as GmailEmailClientCredentials;
  }

  private async checkCredentials(
    credentials: EmailClientCredentials,
  ): Promise<EmailClientCredentials> {
    const oauth2Client = this.buildOAuth2Client(credentials);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    await gmail.users.getProfile({ userId: 'me' });

    return credentials;
  }

  private buildOAuth2Client(credentials?: EmailClientCredentials) {
    const client = new google.auth.OAuth2({
      clientId: this.gmailConfig.gmail.clientId,
      clientSecret: this.gmailConfig.gmail.clientSecret,
    });

    if (credentials) {
      client.setCredentials(credentials);
    }

    return client;
  }

  buildAuthentication({
    redirectUri,
  }: AuthenticationInput): AuthenticationOutput {
    const oauth2Client = this.buildOAuth2Client();

    return {
      buildRequestUrl: () => {
        return oauth2Client.generateAuthUrl({
          access_type: 'offline',
          scope: GmailEmailClient.SCOPES,
          redirect_uri: redirectUri,
        });
      },
      handleTokenRedirectRequest: async (request) => {
        if (!request.url) {
          throw new Error('Request URL not found');
        }

        const { searchParams } = new URL(request.url, redirectUri);
        const code = searchParams.get('code');

        if (!code) {
          throw new Error('Authorization code not found');
        }

        const { tokens } = await oauth2Client.getToken({
          code,
          redirect_uri: redirectUri,
        });

        await this.storage.saveEmailClientCredentials(
          GmailEmailClient.ADAPTER_NAME,
          tokens as Record<string, unknown>,
        );
      },
    } as AuthenticationOutput;
  }
}

export interface GmailEmailClientOptions {
  config: Config;
}

export type GmailEmailClientCredentials = {
  access_token: string;
  refresh_token: string;
  scope: string;
  token_type: string;
  expiry_date: number;
};
