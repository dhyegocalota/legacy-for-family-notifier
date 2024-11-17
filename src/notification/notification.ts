import { z } from 'zod';

export type Notification =
  | DraftNotification
  | CheckingNotification
  | CompletedNotification
  | CancelledNotification;

export enum NotificationStatus {
  DRAFT = 'DRAFT',
  CHECKING = 'checking',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export type DraftNotification = {
  startedAt: Date;
  status: NotificationStatus.DRAFT;
  sequenceOfMonthDays: number[];
  lastSequenceIndexSent: undefined;
  lastSequenceSentAt: undefined;
  threadId: undefined;
  legacyUrl: string;
};

export type CheckingNotification = {
  startedAt: Date;
  status: NotificationStatus.CHECKING;
  sequenceOfMonthDays: number[];
  lastSequenceIndexSent: number;
  lastSequenceSentAt: Date;
  threadId: string;
  legacyUrl: string;
};

export type CompletedNotification = {
  startedAt: Date;
  status: NotificationStatus.COMPLETED;
  sequenceOfMonthDays: number[];
  lastSequenceIndexSent: number;
  lastSequenceSentAt: Date;
  threadId: string;
  legacyUrl: string;
};

export type CancelledNotification = {
  startedAt: Date;
  status: NotificationStatus.CANCELLED;
  sequenceOfMonthDays: number[];
  lastSequenceIndexSent: number;
  lastSequenceSentAt: Date;
  threadId: string;
  legacyUrl: string;
};

export const validateNotification = (
  notification: Notification,
): Notification => {
  return notificationSchema.parse(notification);
};

export const notificationSchema = z
  .union([
    z.object({
      startedAt: z.date(),
      status: z.literal(NotificationStatus.DRAFT),
      sequenceOfMonthDays: z.array(z.number()),
      lastSequenceIndexSent: z.undefined(),
      lastSequenceSentAt: z.undefined(),
      threadId: z.undefined(),
      legacyUrl: z.string(),
    }),
    z.object({
      startedAt: z.date(),
      status: z.literal(NotificationStatus.CHECKING),
      sequenceOfMonthDays: z.array(z.number()),
      lastSequenceIndexSent: z.number(),
      lastSequenceSentAt: z.date(),
      threadId: z.string(),
      legacyUrl: z.string(),
    }),
    z.object({
      startedAt: z.date(),
      status: z.literal(NotificationStatus.COMPLETED),
      sequenceOfMonthDays: z.array(z.number()),
      lastSequenceIndexSent: z.number(),
      lastSequenceSentAt: z.date(),
      threadId: z.string(),
      legacyUrl: z.string(),
    }),
    z.object({
      startedAt: z.date(),
      status: z.literal(NotificationStatus.CANCELLED),
      sequenceOfMonthDays: z.array(z.number()),
      lastSequenceIndexSent: z.number(),
      lastSequenceSentAt: z.date(),
      threadId: z.string(),
      legacyUrl: z.string(),
    }),
  ])
  .refine(
    (notification) =>
      notification.sequenceOfMonthDays.every(
        (sequence, index) =>
          Number.isInteger(sequence) &&
          sequence >= 0 &&
          (!notification.sequenceOfMonthDays[index - 1] ||
            sequence > notification.sequenceOfMonthDays[index - 1]),
      ),
    {
      message: 'Sequence must be an array of increasing integers',
      path: ['sequenceOfMonthDays'],
    },
  )
  .refine(
    (notification) =>
      notification.lastSequenceIndexSent === undefined ||
      notification.lastSequenceIndexSent <
        notification.sequenceOfMonthDays.length,
    {
      message:
        'lastSequenceIndexSent must be less than the length of the sequence',
      path: ['lastSequenceIndexSent'],
    },
  )
  .refine(
    (notification) =>
      notification.lastSequenceSentAt
        ? notification.lastSequenceSentAt >= notification.startedAt
        : true,
    {
      message: 'lastSequenceSentAt must be greater than or equal to startedAt',
      path: ['lastSequenceSentAt'],
    },
  )
  .refine((notification) => notification.startedAt <= new Date(), {
    message: 'startedAt must be less than or equal to the current date',
  });

export const getNotification = async ({
  storage,
}: {
  storage: Storage;
}): Promise<Notification | null> => {
  const notification = await storage.getNotification();

  if (!notification) {
    return null;
  }

  return validateNotification(notification);
};

export const saveNotification = async ({
  storage,
  notification,
}: {
  storage: Storage;
  notification: Notification;
}): Promise<void> => {
  validateNotification(notification);
  await storage.saveNotification(notification);
};
