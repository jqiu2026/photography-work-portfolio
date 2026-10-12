import { mockId } from "./store";

/**
 * Payment interface. The Phase 3 implementation wraps Stripe (Payment Intents); this mock mirrors the *shape* of a Stripe
 * test-mode PaymentIntent so the UI and tests do not change when the real provider arrives. It never talks to a network and
 * accepts no real card: only the documented test numbers below behave as described.
 */
export type PaymentStatus = "requires_payment_method" | "requires_confirmation" | "succeeded" | "canceled";
export type PaymentIntent = {
  id: string;
  object: "payment_intent";
  amount: number;
  currency: "usd";
  status: PaymentStatus;
  description?: string;
  metadata: Record<string, string>;
  last_payment_error?: { code: string; message: string };
  mock: true;
};
export type CardInput = { number: string; exp: string; cvc: string; name?: string };
export type ConfirmResult = { ok: true; intent: PaymentIntent; receiptId: string } | { ok: false; intent: PaymentIntent; error: string };

export interface PaymentProvider {
  createIntent(input: { amount: number; description?: string; metadata?: Record<string, string> }): Promise<PaymentIntent>;
  confirm(intent: PaymentIntent, card: CardInput): Promise<ConfirmResult>;
}

/** Stripe's published test numbers (documentation values, safe to hard-code). */
export const TEST_CARDS = {
  success: "4242424242424242",
  declined: "4000000000000002",
  insufficientFunds: "4000000000009995",
} as const;

const digits = (s: string) => s.replace(/\D/g, "");

function expiryOk(exp: string, now: Date) {
  const m = /^(\d{2})\s*\/\s*(\d{2})$/.exec(exp.trim());
  if (!m) return false;
  const month = Number(m[1]);
  const year = 2000 + Number(m[2]);
  if (month < 1 || month > 12) return false;
  return year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1);
}

export class MockPaymentProvider implements PaymentProvider {
  constructor(private now: () => Date = () => new Date()) {}

  async createIntent(input: { amount: number; description?: string; metadata?: Record<string, string> }) {
    if (!Number.isInteger(input.amount) || input.amount < 50) throw new Error("Amount must be at least 50 cents.");
    return {
      id: mockId("pi_mock"),
      object: "payment_intent" as const,
      amount: input.amount,
      currency: "usd" as const,
      status: "requires_payment_method" as PaymentStatus,
      description: input.description,
      metadata: input.metadata ?? {},
      mock: true as const,
    };
  }

  async confirm(intent: PaymentIntent, card: CardInput): Promise<ConfirmResult> {
    const fail = (code: string, message: string): ConfirmResult => ({
      ok: false,
      error: message,
      intent: { ...intent, status: "requires_payment_method", last_payment_error: { code, message } },
    });
    if (intent.status === "succeeded") return fail("already_paid", "This payment is already complete.");
    const n = digits(card.number);
    if (n.length < 13) return fail("incomplete_number", "Enter the full card number. In this mock, use 4242 4242 4242 4242.");
    if (!expiryOk(card.exp, this.now())) return fail("invalid_expiry", "Enter a future expiry as MM / YY.");
    if (!/^\d{3,4}$/.test(card.cvc.trim())) return fail("invalid_cvc", "Enter the 3 or 4 digit security code.");
    if (n === TEST_CARDS.declined) return fail("card_declined", "Your card was declined (mock test card).");
    if (n === TEST_CARDS.insufficientFunds) return fail("insufficient_funds", "Your card has insufficient funds (mock test card).");
    if (n !== TEST_CARDS.success) return fail("mock_only", "This is a mock. Only the Stripe test card 4242 4242 4242 4242 is accepted.");
    return { ok: true, intent: { ...intent, status: "succeeded" }, receiptId: mockId("rcpt_mock") };
  }
}
