import { z } from 'zod';

import { EmailConfig } from '@/email';

export interface Config {
  storage: StorageConfig;
  emailClient: EmailClientConfig;
  senderEmailAddress: string;
  managerEmailAddress: string;
  familyEmailAddress: string;
  checkEmail: EmailConfig;
  legacyEmail: EmailConfig;
  cancellationEmail: EmailConfig;
  sequenceOfMonthDaysToNotify: number[];
}

export type StorageConfig = {
  adapter: string;
  [key: string]: unknown;
};

export type EmailClientConfig = {
  adapter: string;
  [key: string]: unknown;
};

const DEFAULT_CONFIG: Partial<Config> = {
  checkEmail: {
    subject: '[Legacy Notification] {notificationLabel}',
    body: 'This is a check notification number #{notificationNumber}. Reply to this email to cancel the legacy email. If you do not cancel it, the legacy email will be sent on {notificationCompletionDate}.',
  },
  cancellationEmail: {
    subject: '[Legacy Notification] {notificationLabel}',
    body: 'Your notification has been cancelled. Next check will be on {notificationNextCheckDate}.',
  },
};

export const validateConfig = (config: Config): Config => {
  configSchema.parse(config);
  return { ...DEFAULT_CONFIG, ...config };
};

export const configSchema = z
  .object({
    storage: z.object({
      adapter: z.string(),
    }),
    emailClient: z.object({
      adapter: z.string(),
    }),
    senderEmailAddress: z.string(),
    managerEmailAddress: z.string(),
    familyEmailAddress: z.string(),
    checkEmail: z
      .object({
        subject: z.string(),
        body: z.string(),
      })
      .optional(),
    legacyEmail: z.object({
      subject: z.string(),
      body: z.string(),
    }),
    cancellationEmail: z
      .object({
        subject: z.string(),
        body: z.string(),
      })
      .optional(),
    sequenceOfMonthDaysToNotify: z.array(z.number()),
  })
  .refine((config) => config.sequenceOfMonthDaysToNotify.length > 1, {
    message: 'At least two days should be provided',
    path: ['sequenceOfMonthDaysToNotify'],
  })
  .refine(
    (config) => {
      const uniqueEmails = new Set([
        config.senderEmailAddress,
        config.managerEmailAddress,
        config.familyEmailAddress,
      ]);

      return uniqueEmails.size === 3;
    },
    {
      message:
        'senderEmailAddress, managerEmailAddress, familyEmailAddress must be different',
      path: ['senderEmailAddress', 'managerEmailAddress', 'familyEmailAddress'],
    },
  );
