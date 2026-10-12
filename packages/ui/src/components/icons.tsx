import {
  siApplemusic,
  siBandcamp,
  siDiscord,
  siFlickr,
  siGithub,
  siGmail,
  siInstagram,
  siSoundcloud,
  siSpotify,
  siThreads,
  siTiktok,
  siVimeo,
  siX,
  siYoutube,
} from "simple-icons";
import { Globe, Mail } from "lucide-react";

const brands = {
  applemusic: siApplemusic,
  bandcamp: siBandcamp,
  discord: siDiscord,
  flickr: siFlickr,
  github: siGithub,
  gmail: siGmail,
  instagram: siInstagram,
  soundcloud: siSoundcloud,
  spotify: siSpotify,
  threads: siThreads,
  tiktok: siTiktok,
  vimeo: siVimeo,
  x: siX,
  youtube: siYoutube,
} as const;
export type BrandName = keyof typeof brands | "linkedin" | "email" | "web";

/** Brand glyphs (simple-icons, CC0) plus a few generic ones. Decorative: always pair with visible text or aria-label. */
export function BrandIcon({ name, size = 18 }: { name: BrandName | string; size?: number }) {
  if (name === "email") return <Mail size={size} aria-hidden />;
  if (name === "web") return <Globe size={size} aria-hidden />;
  if (name === "linkedin")
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden fill="currentColor">
        <path
          fillRule="evenodd"
          d="M4 2h16a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm1.6 7.2h2.9V18H5.6V9.2Zm1.45-4.1a1.7 1.7 0 1 1 0 3.4 1.7 1.7 0 0 1 0-3.4ZM10.2 9.2H13v1.2c.4-.7 1.4-1.4 2.8-1.4 3 0 3.4 1.9 3.4 4.4V18h-2.9v-4.1c0-1 0-2.2-1.4-2.2s-1.6 1-1.6 2.1V18h-2.9V9.2Z"
        />
      </svg>
    );
  const b = brands[name as keyof typeof brands];
  if (!b) return <Globe size={size} aria-hidden />;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <path d={b.path} />
    </svg>
  );
}
