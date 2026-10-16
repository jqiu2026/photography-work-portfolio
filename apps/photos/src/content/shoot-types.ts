/**
 * The kinds of shoot the inquiry forms handle. Copy is a plain draft: `TODO(owner)` to rewrite in your voice. No price,
 * package or turnaround is promised here (prices are placeholders until the owner sets them, Q61).
 */
export type ExtraField = { name: string; label: string; hint?: string; kind?: "text" | "number" | "textarea" };
export type ShootType = {
  slug: string;
  label: string;
  headline: string;
  blurb: string;
  messageHint: string;
  extra: ExtraField[];
};

export const shootTypes: ShootType[] = [
  {
    slug: "event",
    label: "Event",
    headline: "Events",
    blurb: "Open houses, fairs, dinners, runs and everything with a crowd and a schedule.",
    messageHint: "What is the event, who is it for, and what do you want the photographs for?",
    extra: [
      { name: "Event name", label: "Event name" },
      { name: "Hours of coverage", label: "Hours of coverage you have in mind", kind: "text" },
    ],
  },
  {
    slug: "performance",
    label: "Performance",
    headline: "Performances",
    blurb: "Theater, dance and music. Low light, fast moments, and rehearsals as well as the show.",
    messageHint: "Which production or ensemble, and which rehearsals or shows should I cover?",
    extra: [
      { name: "Production or ensemble", label: "Production or ensemble" },
      { name: "Venue", label: "Venue" },
    ],
  },
  {
    slug: "portrait",
    label: "Portrait",
    headline: "Portraits",
    blurb: "One person or a small group, indoors or out.",
    messageHint: "Who is in the photographs and what are they for?",
    extra: [{ name: "Preferred setting", label: "Preferred setting (studio, outdoors, at home)" }],
  },
  {
    slug: "headshots",
    label: "Headshots",
    headline: "Headshots",
    blurb: "Clean, honest headshots for people and small teams.",
    messageHint: "How many people, and where will the headshots be used?",
    extra: [{ name: "People", label: "Number of people", kind: "number" }],
  },
  {
    slug: "school",
    label: "School or team",
    headline: "Schools and teams",
    blurb: "Clubs, teams, classes and school events. Photographs of minors follow the strictest gallery access.",
    messageHint: "Which group and which events? Anything I should know about permissions?",
    extra: [{ name: "Group", label: "School, club or team" }],
  },
  {
    slug: "aviation",
    label: "Aviation",
    headline: "Aviation",
    blurb: "Aircraft on the ground and in the air. Drone work only where it is legal and safe.",
    messageHint: "Which aircraft or airline, where, and what are the photographs for?",
    extra: [{ name: "Location", label: "Airport or location" }],
  },
  {
    slug: "licensing",
    label: "Licence a photograph",
    headline: "Licensing",
    blurb: "Ask to use one of my photographs.",
    messageHint: "Which photograph (a page link or a description), where will it appear, and for how long?",
    extra: [
      { name: "Photograph", label: "Photograph (link or description)" },
      { name: "Intended use", label: "Where it will be used" },
    ],
  },
  {
    slug: "other",
    label: "Something else",
    headline: "Something else",
    blurb: "If it does not fit above, tell me about it.",
    messageHint: "What do you have in mind?",
    extra: [],
  },
];

export const shootType = (slug: string) => shootTypes.find((t) => t.slug === slug);

/** Placeholder ranges until real prices exist (Q61). */
export const budgetOptions = ["Not sure yet", "Under $XX", "$XX to $XX", "$XX to $XX or more"];
