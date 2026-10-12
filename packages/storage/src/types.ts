export type StoredObject = { body: Uint8Array; contentType: string };
export type ObjectInfo = { bytes: number; contentType: string };

/**
 * Where bytes live. Two logical stores exist: "originals" (private, never served directly) and "public"
 * (downscaled, metadata-stripped derivatives). Implementations: local filesystem (dev), Cloudflare R2, Vercel Blob (public only).
 */
export interface StorageProvider {
  readonly name: "local" | "r2" | "blob";
  put(key: string, body: Uint8Array, opts: { contentType: string }): Promise<void>;
  get(key: string): Promise<StoredObject | null>;
  head(key: string): Promise<ObjectInfo | null>;
  delete(key: string): Promise<void>;
  list(prefix: string): Promise<{ key: string; bytes: number }[]>;
  /** Short-lived URL for a browser to PUT (direct upload, avoids function body limits) or GET. */
  getSignedUrl(key: string, opts: { expiresIn: number; method: "GET" | "PUT"; contentType?: string }): Promise<string>;
}

/** Keys are random ids plus a safe suffix; reject anything that could escape a prefix. */
export function assertSafeKey(key: string) {
  if (
    !key ||
    key.length > 300 ||
    key.startsWith("/") ||
    key.includes("..") ||
    key.includes("\\") ||
    /[^a-zA-Z0-9/_.\-]/.test(key)
  ) {
    throw new Error(`Unsafe storage key: ${JSON.stringify(key).slice(0, 80)}`);
  }
}
