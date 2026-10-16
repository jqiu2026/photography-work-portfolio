import { todo } from "./site";

/**
 * Music content. Only real facts are written here (see docs/project/audit-once-ui.md).
 * Everything else is a dev-only placeholder via todo(); empty fields and empty lists are hidden in production.
 */
export type Recording = {
  title: string;
  provider: "youtube" | "spotify" | "soundcloud" | "bandcamp";
  id: string;
  note?: string;
  date?: string;
  rights: "original" | "cover" | "licensed" | "third-party-embed";
};
export type Performance = { title: string; date: string; venue?: string; ensemble?: string; note?: string };

export const music = {
  intro: todo("two or three sentences about your musical background"),
  instruments: [] as string[],
  story: todo("how you started playing, in your voice"),
  recordings: [] as Recording[],
  performances: [] as Performance[],
  repertoire: [] as string[],
};
