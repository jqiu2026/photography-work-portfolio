import { todo } from "./site";

/**
 * Flying content. Only real facts are written here (see docs/project/audit-once-ui.md).
 * Everything else is a dev-only placeholder via todo(); empty fields and empty lists are hidden in production.
 */
export type FlightEntry = { title: string; date: string; note?: string; photo?: string; safeToPublish: boolean };

export const flying = {
  intro: "Notes and photos about flying.",
  story: todo("how flying started for you, in plain terms"),
  /** Real: from the original About page. */
  certificates: [
    {
      title: "FAA Part 107 remote pilot (drones)",
      note: "Certified drone pilot with some experience in aerial photography and videography. Currently exploring FPV flying.",
    },
  ],
  /** Real: managed account since April 2024 (original About page). */
  club: {
    name: "StuyAviators",
    note: "I run the club's Instagram account.",
    href: "https://instagram.com/stuyaviators",
  },
  aircraftFlown: [] as { name: string; note?: string }[],
  log: [] as FlightEntry[],
  /** Real photographs from the portfolio ("Aviation"). */
  photographed: ["jetblue-a220-300-1", "jetblue-a321neo-1"],
  disclaimer: "This is a personal account of learning to fly. It is not flight instruction or aviation advice.",
};
