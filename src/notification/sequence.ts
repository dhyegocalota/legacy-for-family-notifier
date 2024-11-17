import { Config } from '@/config';
import { Email } from '@/email';
import { Notification } from '@/notification/notification';

export abstract class NotificationSequence {
  readonly monthDay: number;
  readonly config: Config;

  constructor({ monthDay, config }: NotificationSequenceOptions) {
    this.monthDay = monthDay;
    this.config = config;
  }

  isNotificationDue(notification: Notification): boolean {
    const maxMonthDay = this.getMaxMonthDay(notification.startedAt);
    const now = new Date();
    const currentMonthDay = now.getDate();

    if (this.monthDay > maxMonthDay) {
      return currentMonthDay === maxMonthDay;
    }

    return currentMonthDay >= this.monthDay;
  }

  private getMaxMonthDay(date: Date): number {
    const nextMonth = new Date(date);
    nextMonth.setMonth(date.getMonth() + 1);
    nextMonth.setDate(0);

    return nextMonth.getDate();
  }

  abstract buildEmailForNotification(notification: Notification): Email;

  public getEmailVariablesForNotification(
    notification: Notification,
  ): Record<string, string> {
    const lastMonthDay =
      notification.sequenceOfMonthDays[
        notification.sequenceOfMonthDays.length - 1
      ];

    const now = new Date();
    const completionDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      lastMonthDay,
    );

    return {
      notificationsTotal: notification.sequenceOfMonthDays.length.toString(),
      notificationNumber: String(notification.lastSequenceIndexSent! + 1),
      notificationLabel: `${notification.startedAt.getMonth() + 1}/${notification.startedAt.getFullYear()}`,
      notificationNextCheckDate:
        this.getNextNotificationDate().toLocaleDateString(),
      notificationCompletionDate: completionDate.toLocaleDateString(),
    };
  }

  private getNextNotificationDate(): Date {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = nextMonth === 0 ? currentYear + 1 : currentYear;

    return new Date(nextYear, nextMonth, this.monthDay);
  }
}

export interface NotificationSequenceOptions {
  monthDay: number;
  config: Config;
}
