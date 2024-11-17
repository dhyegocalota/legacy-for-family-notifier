import * as http from 'http';
import { AddressInfo } from 'node:net';

import { Config } from '@/config/config';
import { Email } from '@/email';
import { EmailClient, getEmailClientByConfig } from '@/email-client';
import {
  Notification,
  NotificationSequence,
  NotificationStatus,
} from '@/notification';
import { CheckingNotificationSequence } from '@/notification/sequences/checking';
import { CompleteNotificationSequence } from '@/notification/sequences/complete';
import { Storage, getStorageByConfig } from '@/storage';

export class Notificator {
  private readonly config: Config;
  private readonly storage: Storage;
  private readonly emailClient: EmailClient;
  private readonly sequences: NotificationSequence[];

  constructor({ config }: NotificatorOptions) {
    this.config = config;
    this.sequences = this.config.sequenceOfMonthDaysToNotify.map(
      (monthDay, sequenceIndex) => {
        const isLastSequence =
          sequenceIndex === this.config.sequenceOfMonthDaysToNotify.length - 1;

        if (isLastSequence) {
          return new CompleteNotificationSequence({
            config,
            monthDay,
          });
        }

        return new CheckingNotificationSequence({
          config,
          monthDay,
        });
      },
    );

    if (this.sequences.length === 0) {
      throw new Error('At least one sequence should be provided');
    }

    this.storage = getStorageByConfig(config);
    this.emailClient = getEmailClientByConfig(config);
  }

  async notify(): Promise<Notification> {
    const notification = await this.getOrCreateNotification();
    const hasSequenceChanged =
      this.config.sequenceOfMonthDaysToNotify.length !==
        notification.sequenceOfMonthDays.length ||
      this.config.sequenceOfMonthDaysToNotify.some(
        (monthDay, sequenceIndex) =>
          monthDay !== notification.sequenceOfMonthDays[sequenceIndex],
      );

    if (hasSequenceChanged) {
      return this.startNotification(notification);
    }

    if (notification.status === NotificationStatus.COMPLETED) {
      return notification;
    }

    if (notification.status === NotificationStatus.DRAFT) {
      return this.startNotification(notification);
    }

    if (notification.status === NotificationStatus.CANCELLED) {
      return this.restartNotification(notification);
    }

    if (notification.status === NotificationStatus.CHECKING) {
      return this.checkNotification(notification);
    }

    throw new Error('Unknown notification status');
  }

  private buildCancellationEmail(notification: Notification): Email {
    return {
      threadId: notification.threadId!,
      senderEmailAddress: this.config.senderEmailAddress,
      recipientEmailAddress: this.config.managerEmailAddress,
      subject: this.config.cancellationEmail.subject,
      body: this.config.cancellationEmail.body,
      variables:
        this.sequences[0].getEmailVariablesForNotification(notification),
    };
  }

  private async getOrCreateNotification(): Promise<Notification> {
    const existingNotification = await this.storage.getNotification();

    if (existingNotification) {
      return existingNotification;
    }

    const initialNotification: Notification = {
      status: NotificationStatus.DRAFT,
      startedAt: new Date(),
      sequenceOfMonthDays: this.sequences.map((sequence) => sequence.monthDay),
      threadId: undefined,
      lastSequenceSentAt: undefined,
      lastSequenceIndexSent: undefined,
    };

    await this.storage.saveNotification(initialNotification);

    return initialNotification;
  }

  private async startNotification(
    notification: Notification,
  ): Promise<Notification> {
    notification.startedAt = new Date();
    notification.status = NotificationStatus.CHECKING;
    notification.lastSequenceIndexSent = 0;
    notification.lastSequenceSentAt = new Date();
    notification.threadId = undefined;
    notification.sequenceOfMonthDays = this.sequences.map(
      (sequence) => sequence.monthDay,
    );

    const notificationEmail =
      this.sequences[
        notification.lastSequenceIndexSent
      ].buildEmailForNotification(notification);

    const { threadId } = await this.emailClient.sendEmail(notificationEmail);
    notification.threadId = threadId;

    await this.storage.saveNotification(notification);

    return notification;
  }

  private async restartNotification(
    notification: Notification,
  ): Promise<Notification> {
    const now = new Date();
    const hasNewMonthBegin =
      now.getMonth() > notification.startedAt.getMonth() &&
      now.getFullYear() > notification.startedAt.getFullYear();

    const canRestart =
      hasNewMonthBegin && this.sequences[0].isNotificationDue(notification);

    if (!canRestart) {
      return notification;
    }

    return this.startNotification(notification);
  }

  private async checkNotification(
    notification: Notification,
  ): Promise<Notification> {
    if (notification.lastSequenceIndexSent === undefined) {
      throw new Error('lastSequenceIndexSent is not defined');
    }

    const shouldCancel = await this.emailClient.hasThreadBeenAnswered(
      notification.threadId,
    );

    if (shouldCancel) {
      return this.cancelNotification(notification);
    }

    const nextSequenceIndex = notification.lastSequenceIndexSent + 1;
    const nextSequence = this.sequences[nextSequenceIndex];
    const shouldComplete = nextSequenceIndex === this.sequences.length - 1;

    if (shouldComplete) {
      return this.completeNotification(notification);
    }

    if (!nextSequence.isNotificationDue(notification)) {
      return notification;
    }

    notification.lastSequenceIndexSent = nextSequenceIndex;
    notification.lastSequenceSentAt = new Date();

    const notificationEmail =
      this.sequences[
        notification.lastSequenceIndexSent
      ].buildEmailForNotification(notification);

    const { threadId } = await this.emailClient.sendEmail(notificationEmail);
    notification.threadId = threadId;

    await this.storage.saveNotification(notification);

    return notification;
  }

  private async cancelNotification(
    notification: Notification,
  ): Promise<Notification> {
    notification.status = NotificationStatus.CANCELLED;

    const cancellationEmail = this.buildCancellationEmail(notification);
    const { threadId } = await this.emailClient.sendEmail(cancellationEmail);
    notification.threadId = threadId;

    await this.storage.saveNotification(notification);

    return notification;
  }

  private async completeNotification(
    notification: Notification,
  ): Promise<Notification> {
    const lastSequenceIndex = this.sequences.length - 1;

    notification.status = NotificationStatus.COMPLETED;
    notification.lastSequenceIndexSent = lastSequenceIndex;
    notification.lastSequenceSentAt = new Date();

    const notificationEmail =
      this.sequences[lastSequenceIndex].buildEmailForNotification(notification);

    const { threadId } = await this.emailClient.sendEmail(notificationEmail);
    notification.threadId = threadId;

    await this.storage.saveNotification(notification);

    return notification;
  }

  authenticate({
    onServerAddress,
    onRequestUrl,
  }: AuthenticateInput): Promise<void> {
    return new Promise((resolve, reject) => {
      const server = http.createServer();
      server.listen(0, async () => {
        const serverAddress = server.address() as AddressInfo;
        onServerAddress(serverAddress);

        const redirectUri = `http://localhost:${serverAddress.port}`;
        const authentication = this.emailClient.buildAuthentication({
          redirectUri,
        });

        server.on('request', async (request, response) => {
          try {
            await authentication.handleTokenRedirectRequest(request);
            response.statusCode = 200;
            response.end(
              'Authentication successful. You can close this tab now.',
            );

            server.close();
            resolve();
          } catch (error) {
            response.statusCode = 500;
            response.end('Authentication failed. Check the logs for details.');

            server.close();
            reject(error);
          }
        });

        server.on('error', (error) => {
          reject(error);
        });

        const requestUrl = authentication.buildRequestUrl();
        onRequestUrl(requestUrl);
      });
    });
  }
}

export interface NotificatorOptions {
  config: Config;
}

export interface AuthenticateInput {
  onServerAddress: (address: AddressInfo) => void;
  onRequestUrl: (url: string) => void;
}
