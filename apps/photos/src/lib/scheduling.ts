/** Kinds of time a visitor can book online. `deposit` ones hold the slot until the deposit invoice is paid. */
export type ScheduleKind = {
  slug: string;
  label: string;
  blurb: string;
  deposit: boolean;
  durationKey: "consult" | "shoot";
};

export const scheduleKinds: ScheduleKind[] = [
  {
    slug: "consult",
    label: "Free consultation",
    blurb: "A short call to talk through your idea. No payment.",
    deposit: false,
    durationKey: "consult",
  },
  {
    slug: "portrait",
    label: "Portrait session",
    blurb: "Holds your time with a deposit (amount is a SAMPLE until set).",
    deposit: true,
    durationKey: "shoot",
  },
  {
    slug: "headshots",
    label: "Headshot session",
    blurb: "Holds your time with a deposit (amount is a SAMPLE until set).",
    deposit: true,
    durationKey: "shoot",
  },
];
export const scheduleKind = (slug: string) => scheduleKinds.find((k) => k.slug === slug);
