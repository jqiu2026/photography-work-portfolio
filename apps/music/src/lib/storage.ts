import { getSite } from "@jerryqiu/sites";
import { type StorageProvider, createStorage } from "@jerryqiu/storage";

let originals: StorageProvider | undefined;

/**
 * Score files (PDF, MIDI, audio). Private: read server-side only and handed to a buyer through the download route, which
 * stamps a PDF with the buyer's name and license first. With the local driver, signed upload URLs point back at this
 * app's own storage route (`/api/storage/...`).
 */
export function scoreStore(): StorageProvider {
  originals ??= createStorage("originals", { ...process.env, NEXT_PUBLIC_HUB_URL: getSite("music").url });
  return originals;
}
