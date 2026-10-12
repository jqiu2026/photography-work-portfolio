/**
 * MOCK guard. Everything in this package is a local stand-in for a Phase 3 service. It is disabled in production builds:
 * pages call `mocksEnabled()` and render a 404 when it is false. Set `ENABLE_MOCKS=true` only to demonstrate the mocks on a
 * preview deployment (never with live keys: there are none here).
 */
export function mocksEnabled(env: Record<string, string | undefined> = process.env): boolean {
  if (env.ENABLE_MOCKS === "true") return true;
  return env.NODE_ENV !== "production";
}

export class MocksDisabledError extends Error {
  constructor() {
    super("Mocks are disabled in production builds.");
  }
}

export function assertMocks(env: Record<string, string | undefined> = process.env): void {
  if (!mocksEnabled(env)) throw new MocksDisabledError();
}

export const MOCK_BANNER = "MOCK · local only · Phase 3 replaces this with real services";
