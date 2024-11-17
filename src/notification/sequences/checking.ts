import { Email } from '@/email';
import { Notification, NotificationStatus } from '@/notification/notification';
import { NotificationSequence } from '@/notification/sequence';

export class CheckingNotificationSequence extends NotificationSequence {
  buildEmailForNotification(notification: Notification): Email {
    if (notification.status !== NotificationStatus.CHECKING) {
      throw new Error('Notification is not in CHECKING status');
    }

    const lastSequenceMonthDay =
      notification.sequenceOfMonthDays[
        notification.sequenceOfMonthDays.length - 1
      ];

    const completionDate = new Date();
    completionDate.setDate(completionDate.getDate() + lastSequenceMonthDay);

    return {
      threadId: notification.threadId,
      senderEmailAddress: this.config.senderEmailAddress,
      recipientEmailAddress: this.config.managerEmailAddress,
      subject: this.config.checkEmail.subject,
      body: this.config.checkEmail.body,
      variables: this.getEmailVariablesForNotification(notification),
    };
  }
}
