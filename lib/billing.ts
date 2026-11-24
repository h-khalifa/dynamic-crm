/**
 * Payment integration seam. Signup and plan changes call this interface only, so a Stripe
 * (or other) provider can be dropped in later without touching the flows.
 */
export interface BillingProvider {
  /** Returns a URL to redirect the user to for checkout, or null when no payment is needed. */
  startCheckout(input: { tenantId: string; planCode: string; email: string }): Promise<string | null>;
}

class NoopBilling implements BillingProvider {
  async startCheckout() {
    return null; // Payments not integrated yet: every tenant starts on a trial.
  }
}

export const billing: BillingProvider = new NoopBilling();
