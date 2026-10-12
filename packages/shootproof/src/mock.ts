import sharp from "sharp";
import type { ExtEvent, ExtPhoto, ExternalGallerySource, Tokens } from "./types";

/** Recorded-shape fixtures: two events with generated gradient photos. No network, no credentials. */
const events: ExtEvent[] = [
  { id: "9001", brandId: "1", name: "Spring recital (sample)", photosCount: 3, date: "2026-04-12" },
  { id: "9002", brandId: "1", name: "Maker Faire (sample)", photosCount: 2, date: "2025-10-19" },
];
const colours = ["#355c7d", "#c06c84", "#6c5b7b", "#f67280", "#99b898"];

const photosOf = (eventId: string): ExtPhoto[] => {
  const n = events.find((e) => e.id === eventId)?.photosCount ?? 0;
  return Array.from({ length: n }, (_, i) => ({
    id: `${eventId}${i + 1}`,
    eventId,
    brandId: "1",
    name: `Sample ${i + 1}`,
    width: 1800,
    height: 1200,
    url: `https://mock.shootproof.com/${eventId}/${i + 1}.jpg`,
  }));
};

export function createMockShootProof(): ExternalGallerySource {
  const tokens = (): Tokens => ({
    accessToken: "mock-access",
    refreshToken: "mock-refresh",
    expiresAt: Date.now() + 14 * 86_400_000,
  });
  return {
    id: "shootproof",
    mode: "mock",
    // Skips the real consent screen: the callback is hit straight away with a fixed code.
    authorizeUrl: (state, redirectUri) => `${redirectUri}?code=mock-code&state=${encodeURIComponent(state)}`,
    exchangeCode: async (code) => {
      if (code !== "mock-code") throw new Error("Invalid code");
      return tokens();
    },
    refresh: async () => tokens(),
    listEvents: async () => events,
    listPhotos: async (_t, _b, eventId) => photosOf(eventId),
    download: async (_t, photo) =>
      sharp({
        create: { width: 1800, height: 1200, channels: 3, background: colours[Number(photo.id) % colours.length] },
      })
        .jpeg()
        .toBuffer(),
  };
}
