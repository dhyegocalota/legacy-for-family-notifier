# Legacy for Family Notifier

**Disclosure: This project talks about death ⚰️**

I designed this project to notify my family with my legacy message after my death. It ensures that important messages are delivered at the right time, providing peace of mind to users.

This is a CLI app that I built using Node.js, TypeScript, and Redis. It uses the Gmail API to send and receive emails, and it's built with OCLIF.

## How is this app useful?

This app is useful for individuals who wish to leave a legacy message for their family members. It tracks the notification schedule and sends messages based on predefined conditions, ensuring that your message is delivered when needed.

## How does it work?

It's simple! Here's how it works:

1. The app will send a Check Email notification to the Manager on the specified days of the month.
2. The Manager is able to Cancel the Legacy Email notification by simply replying to the Check Email.
3. If the Manager does not cancel the Legacy Email, the app will send the Legacy Email to the Family Member on the last specified day of the month.

## Prerequisites

1. Install Node `>=18.0.0`
2. Install Redis
3. [Set Up Google OAuth2 Credentials](#google-oauth2-credentials)

### Google OAuth2 Credentials
This app requires sensitive OAuth scopes to read and send emails using the Gmail API.
I will guide you to set up a *Test App* in your Google Cloud Console so that you don't need to go through the verification process.

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Search for the `Gmail API` and enable it
4. Go to the menu `APIs & Services` > `OAuth consent screen`
5. Complete the OAuth consent screen setup with the following scopes:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.send`
6. Add your email address as a test user
7. Go to the menu `APIs & Services` > `Credentials`
8. Click on `Create Credentials` > `OAuth client ID`
9. Select `Desktop App` as the application type
10. Type a name for the OAuth client ID
11. Save the `clientId` and `clientSecret` so that you can use them in the configuration file

## Setup

1. Complete [Prerequisites](#prerequisites)
2. Clone the [`legacy-for-family-notifier.config.sample.json`](./legacy-for-family-notifier.config.sample.json) file and rename it to `config.json`
3. Configure the `config.json` file with your settings
4. Install dependencies by running `yarn install`
5. Authenticate the Google account by running `./bin/run.js authenticate --config-file=./config.json`
6. Run the app by running `./bin/run.js run --config-file=./config.json`

### Environment Variables

| Name       | Type                          | Default      | Notes                                                                                  |
| ---------- | ----------------------------- | ------------ |----------------------------------------------------------------------------------------|
| `NODE_ENV` | `production` \| `development` | `production` | Enables headless browsing in production                                                |
| `CONFIG`   | `JSON`                        | `{}`         | Configuration settings for the app in JSON format; See [Configuration](#configuration) |

## Configuration

The configuration is defined in a JSON file. Here is a sample configuration:

| Name                          | Type      | Required   | Default | Notes                                         |
|-------------------------------|-----------|------------|---------| --------------------------------------------- |
| `storage`                     | `Object`  | Yes        |         | Storage configuration for notifications       |
| `storage.adapter`             | `String`  | Yes        |         | Storage adapter to use                        |
| `emailClient`                 | `Object`  | Yes        |         | Email client configuration                    |
| `emailClient.adapter`         | `String`  | Yes        |         | Email client adapter to use                   |
| `senderEmailAddress`          | `String`  | Yes        |         | Email address used to send notifications      |
| `managerEmailAddress`         | `String`  | Yes        |         | Email address for managing notifications      |
| `familyEmailAddress`          | `String`  | Yes        |         | Email address of the family member to notify  |
| `checkEmail`                  | `Object`  | Yes        |         | Email configuration for checking notifications |
| `checkEmail.subject`          | `String`  | Yes        |         | Subject of the email to check                 |
| `checkEmail.body`             | `String`  | Yes        |         | Body of the email to check                    |
| `legacyEmail`                 | `Object`  | Yes        |         | Email configuration for sending legacy message |
| `legacyEmail.subject`         | `String`  | Yes        |         | Subject of the email to send                  |
| `legacyEmail.body`            | `String`  | Yes        |         | Body of the email to send                     |
| `cancellationEmail`           | `Object`  | Yes        |         | Email configuration for sending cancellation message |
| `cancellationEmail.subject`   | `String`  | Yes        |         | Subject of the email to send                  |
| `cancellationEmail.body`      | `String`  | Yes        |         | Body of the email to send                     |
| `sequenceOfMonthDaysToNotify` | `Array`   | Yes        |         | Sequence of month days to notify              |

### Commands

| Name                                                    | Description                                                           | Notes                                                  |
|---------------------------------------------------------|-----------------------------------------------------------------------|--------------------------------------------------------|
| `./bin/run.js authenticate --config-file=./config.json` | Authenticates the Google account with the provided configuration file | Requires setting up the configuration file first       |
| `./bin/run.js dry-run --config-file=./config.json`      | Runs the app in dry-run mode with the provided configuration file     | Requires setting up the configuration file first       |
| `./bin/run.js run --config-file=./config.json`          | Runs the app with the provided configuration file                     | Requires setting up the configuration file first       |

#### Yarn

| Name                               | Description                                             | Notes                                               |
|------------------------------------| ------------------------------------------------------- | --------------------------------------------------- |
| `yarn build`                       | Builds the TypeScript and outputs in the `dist/` folder |                                                    |
| `yarn lint`                        | Lints the TypeScript codebase                           |                                                     |    
| `yarn start`                       | Starts an HTTP server using the `dist/` folder          | Requires executing `yarn build` first               |
| `yarn check-circular-dependencies` | Checks for circular dependencies in the codebase |                                                   |

## Deploying to Production

This app should be easy to deploy to any production environment that supports Node 18+ with environment variables.

### Render

I created a button to deploy this app to Render. You can deploy it with a single click.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

1. Deploy to Render using the button above
2. SSH into the Render Cron Service and run the following command:

```bash
NODE_ENV=development yarn
yarn build
./bin/run.js authenticate
```

## Contributions

This was a hobby project born out of real needs and there was no funding budget at all.

All kinds of contributions or constructive usage feedback are encouraged. Please feel free to [create an Issue](https://github.com/dhyegocalota/legacy-for-family-notifier/issues/new), open a Pull Request, or contribute by answering someone else's Issues.

I'll do my best to review new Issues and Pull Requests ASAP.

## Debug Mode

You can run this app in Debug Mode on your local machine.

```bash
DEBUG=* ./bin/run.js run --config-file=./config.json
```

## Author

Dhyego Calota <dhyegofernando@gmail.com>

## License

MIT
