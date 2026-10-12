import { mockId } from "./store";

/** Client portal interface: how a client reaches their gallery. Phase 3 sends real emails; the mock shows the link on screen. */
export type PortalSession = {
  token: string;
  galleryId: string;
  clientId: string;
  via: "passcode" | "magic-link";
  mock: true;
};
export type PortalGalleryRef = { id: string; clientId: string; passcode: string; clientEmail: string };

export interface ClientPortal {
  withPasscode(passcode: string): Promise<PortalSession | null>;
  requestMagicLink(email: string): Promise<{ link: string; token: string; shownOnScreen: true } | null>;
  redeem(token: string): Promise<PortalSession | null>;
}

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, "");

export class MockClientPortal implements ClientPortal {
  private links = new Map<string, PortalSession>();
  constructor(private galleries: () => PortalGalleryRef[]) {}

  async withPasscode(passcode: string) {
    const g = this.galleries().find((x) => norm(x.passcode) === norm(passcode));
    return g
      ? {
          token: mockId("sess_mock"),
          galleryId: g.id,
          clientId: g.clientId,
          via: "passcode" as const,
          mock: true as const,
        }
      : null;
  }

  async requestMagicLink(email: string) {
    const e = email.trim().toLowerCase();
    const g = this.galleries().find((x) => x.clientEmail.toLowerCase() === e);
    if (!g) return null;
    const token = mockId("ml_mock");
    this.links.set(token, { token, galleryId: g.id, clientId: g.clientId, via: "magic-link", mock: true });
    // Phase 3 emails this link. The mock returns it so it can be shown on screen; nothing is ever sent.
    return { link: `/client/g/${g.id}?ml=${token}`, token, shownOnScreen: true as const };
  }

  async redeem(token: string) {
    const s = this.links.get(token);
    if (!s) return null;
    this.links.delete(token); // single use
    return s;
  }
}
