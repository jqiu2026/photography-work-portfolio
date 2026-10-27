export type Provider = "youtube" | "spotify" | "soundcloud" | "bandcamp";

/** What an id may look like for each provider. Anything else is refused, so a bad id can never become a bad URL. */
const ID: Record<Provider, RegExp> = {
  youtube: /^[A-Za-z0-9_-]{6,20}$/,
  spotify: /^[A-Za-z0-9]{10,30}$/,
  soundcloud: /^[0-9]{3,15}$/,
  bandcamp: /^[0-9]{3,15}$/,
};

export function validEmbedId(provider: string, id: string): boolean {
  return provider in ID && ID[provider as Provider].test(id);
}

/** The iframe address for a recording, or null when the provider or id is not valid. Autoplay because the visitor pressed play. */
export function embedUrl(provider: string, id: string): string | null {
  if (!validEmbedId(provider, id)) return null;
  switch (provider as Provider) {
    case "youtube":
      return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
    case "spotify":
      return `https://open.spotify.com/embed/track/${id}`;
    case "soundcloud":
      return `https://w.soundcloud.com/player/?url=${encodeURIComponent(`https://api.soundcloud.com/tracks/${id}`)}&auto_play=true`;
    case "bandcamp":
      return `https://bandcamp.com/EmbedPlayer/album=${id}/size=large/bgcol=0b0b10/linkcol=e8b04b/tracklist=false/transparent=true/`;
  }
}

export const isAudioOnly = (provider: string) => provider !== "youtube";

export const PROVIDER_LABEL: Record<Provider, string> = {
  youtube: "YouTube",
  spotify: "Spotify",
  soundcloud: "SoundCloud",
  bandcamp: "Bandcamp",
};
