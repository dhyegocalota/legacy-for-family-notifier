export interface Email extends EmailConfig {
  threadId: string;
  senderEmailAddress: string;
  recipientEmailAddress: string;
  variables: Record<string, string>;
}

export interface EmailConfig {
  subject: string;
  body: string;
}

const buildEmailTemplate = (
  template: string,
  variables: Record<string, string>,
): string => {
  return Object.entries(variables).reduce((body, [key, value]) => {
    return body.replace(new RegExp(`{${key}}`, 'g'), value);
  }, template);
};

export const buildEmailSubject = (email: Email): string => {
  return buildEmailTemplate(email.subject, email.variables);
};

export const buildEmailBody = (email: Email): string => {
  return buildEmailTemplate(email.body, email.variables);
};
