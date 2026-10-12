/**
 * A temporary source of photographs owned by someone else's service (today ShootProof). The studio imports a chosen
 * event as short-lived, downscaled derivatives for display; originals are never kept.
 */
export type Tokens = { accessToken: string; refreshToken: string; expiresAt: number };
export type ExtEvent = { id: string; brandId: string; name: string; photosCount: number; date?: string };
export type ExtPhoto = {
  id: string;
  eventId: string;
  brandId: string;
  name: string;
  width: number;
  height: number;
  /** Where to download a display-size image. Validated against an allow-list before any request. */
  url: string;
};

export interface ExternalGallerySource {
  readonly id: "shootproof";
  /** `mock` serves generated fixtures and never touches the network. It is refused in production. */
  readonly mode: "live" | "mock";
  authorizeUrl(state: string, redirectUri: string): string;
  exchangeCode(code: string, redirectUri: string): Promise<Tokens>;
  refresh(refreshToken: string): Promise<Tokens>;
  listEvents(accessToken: string): Promise<ExtEvent[]>;
  listPhotos(accessToken: string, brandId: string, eventId: string): Promise<ExtPhoto[]>;
  download(accessToken: string, photo: ExtPhoto): Promise<Buffer>;
}
