/** Email seam. In development messages are logged to the server console. */
export interface Mailer {
  send(msg: { to: string; subject: string; text: string }): Promise<void>;
}

class ConsoleMailer implements Mailer {
  async send(msg: { to: string; subject: string; text: string }) {
    console.log(`\n──── EMAIL to ${msg.to} ────\nSubject: ${msg.subject}\n\n${msg.text}\n────────────────────────\n`);
  }
}

export const mailer: Mailer = new ConsoleMailer();
