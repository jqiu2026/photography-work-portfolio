import { stripeConfigured } from "@jerryqiu/payments";
import { mocksEnabled } from "@jerryqiu/mocks";

/** Which way an invoice can be paid in this deployment: real Stripe Checkout, the local mock, or not at all. */
export function paymentMode(): "stripe" | "mock" | "none" {
  if (stripeConfigured()) return "stripe";
  return mocksEnabled() ? "mock" : "none";
}
