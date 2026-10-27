import { type RGB, hex } from "./paint";

export type RealmKey = "exposure" | "resonance" | "altitude" | "forge";

/** What the home page knows about each site; the Nexus adds the look. */
export type RealmLink = { key: RealmKey; site: string; href: string; line: string };

export type RealmLook = {
  key: RealmKey;
  name: string;
  dimension: number;
  accent: RGB;
  /** frame blocks: face, deep, trim (the glowing seam) */
  frame: [RGB, RGB, RGB];
  mood: string;
};

/** Four worlds on the ring, in order. Names from the Nexus concept; the looks are their own. */
export const LOOKS: RealmLook[] = [
  {
    key: "exposure",
    name: "Exposure",
    dimension: 1,
    accent: hex("#ffd36b"),
    frame: [hex("#8d927c"), hex("#5d6352"), hex("#6fcf4a")],
    mood: "daylight · the valley · noon into golden hour",
  },
  {
    key: "resonance",
    name: "Resonance",
    dimension: 2,
    accent: hex("#b77cff"),
    frame: [hex("#e4ddb0"), hex("#a99f74"), hex("#b77cff")],
    mood: "the void · pillars that keep time",
  },
  {
    key: "altitude",
    name: "Altitude",
    dimension: 3,
    accent: hex("#6fd8ff"),
    frame: [hex("#eef3f9"), hex("#b9c8dc"), hex("#6fd8ff")],
    mood: "above the cloud sea · wind",
  },
  {
    key: "forge",
    name: "Forge",
    dimension: 4,
    accent: hex("#ff6a2b"),
    frame: [hex("#2a1830"), hex("#140a18"), hex("#ff6a2b")],
    mood: "the lava sea · sparks off the anvil",
  },
];

export const lookOf = (key: RealmKey) => LOOKS.find((l) => l.key === key) as RealmLook;
