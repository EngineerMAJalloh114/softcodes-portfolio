import "server-only";

/**
 * Transactional email (H-01). One interface, swappable adapters.
 *
 * Resend is deferred (DEC-35). Until then:
 *  - development: `devLogAdapter` prints the message (including links) to the server log;
 *  - production:  `notConfiguredAdapter` refuses with EmailNotConfiguredError.
 * Switching to Resend later = add one adapter here and return it from getEmailAdapter().
 */
export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  /** What the email is for — used in logs and the audit trail. */
  kind: "password-reset" | "lead-notification";
};

export interface EmailAdapter {
  readonly name: string;
  /** True when the adapter can actually deliver (or, in dev, log) messages. */
  readonly configured: boolean;
  send(message: EmailMessage): Promise<void>;
}

export class EmailNotConfiguredError extends Error {
  readonly code = "EMAIL_NOT_CONFIGURED";
  constructor() {
    super("Email is not configured on this server, so the message could not be sent.");
    this.name = "EmailNotConfiguredError";
  }
}

/** Development only: write the message to the server log instead of sending it. */
export const devLogAdapter: EmailAdapter = {
  name: "dev-log",
  configured: true,
  async send(message) {
    console.info(
      `[email:dev-log] kind=${message.kind} to=${message.to} subject="${message.subject}"\n${message.text}`,
    );
  },
};

/** Production until a provider is set up: never pretends to send. */
export const notConfiguredAdapter: EmailAdapter = {
  name: "not-configured",
  configured: false,
  async send() {
    throw new EmailNotConfiguredError();
  },
};

// TODO(DEC-35): add a Resend adapter (RESEND_API_KEY) and return it here in production.
export function getEmailAdapter(): EmailAdapter {
  return process.env.NODE_ENV === "production" ? notConfiguredAdapter : devLogAdapter;
}
