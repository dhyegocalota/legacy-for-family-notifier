import { Email } from '@/email';
import { Notification, NotificationStatus } from '@/notification/notification';
import { NotificationSequence } from '@/notification/sequence';

export class CompleteNotificationSequence extends NotificationSequence {
  buildEmailForNotification(notification: Notification): Email {
    if (notification.status !== NotificationStatus.COMPLETED) {
      throw new Error('Notification is not in COMPLETED status');
    }

    return {
      threadId: notification.threadId,
      senderEmailAddress: this.config.senderEmailAddress,
      recipientEmailAddress: this.config.familyEmailAddress,
      subject: this.config.legacyEmail.subject,
      body: this.config.legacyEmail.body,
      variables: this.getEmailVariablesForNotification(notification),
    };
  }
}
