/**
 * Licence tiers for a purchased score. The wording is a DRAFT (TODO(owner): lawyer review, Q13): it is a plain statement
 * of what the buyer may do, printed on the licence page that is added to every delivered score.
 */
export type LicenseTier = "personal" | "ensemble" | "institution";

export const TIERS: Record<LicenseTier, { label: string; summary: string; terms: string[] }> = {
  personal: {
    label: "Personal",
    summary: "One person: study, practice and perform it.",
    terms: [
      "The license holder may print the score for their own use and perform it in public.",
      "The score and its parts may not be shared, resold or posted online.",
    ],
  },
  ensemble: {
    label: "Ensemble",
    summary: "One ensemble: copies for every member, any number of performances.",
    terms: [
      "The named ensemble may print one copy of the score and each part for every member.",
      "The ensemble may perform the piece in public and may record those performances.",
      "The score and its parts may not be shared outside the ensemble, resold or posted online.",
    ],
  },
  institution: {
    label: "Institution",
    summary: "One school or organization: its ensembles, classes and concerts.",
    terms: [
      "The named institution may print copies for its own ensembles and classes and perform the piece in its concerts.",
      "The score and its parts may not be shared outside the institution, resold or posted online.",
    ],
  },
};

export const COMMON_TERMS = [
  "The composer keeps the copyright. This license is not a transfer of ownership.",
  "The copy you download carries your name and license number. Do not remove them.",
  "Questions or a different use? Write to the composer before you perform or share it.",
];

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** `JQM-` plus 4 characters, the order's sequence and the line number: readable, no look-alike characters. */
export function licenseNumber(orderNumber: string, line: number, salt: string): string {
  let h = 2166136261;
  for (const c of `${orderNumber}:${line}:${salt}`) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  let s = "";
  for (let i = 0; i < 4; i++) {
    s += ALPHABET[h % ALPHABET.length];
    h = Math.floor(h / ALPHABET.length) || (h ^ 0x9e3779b9) >>> 0;
  }
  return `JQM-${s}-${orderNumber.replace(/\D/g, "").padStart(5, "0")}-${line + 1}`;
}

export type LicenseFacts = {
  licenseNo: string;
  tier: LicenseTier;
  holder: string;
  /** the ensemble or institution a non-personal license names */
  organization?: string;
  email: string;
  title: string;
  issuedAt: Date;
};

export function licenseLines(f: LicenseFacts): string[] {
  const t = TIERS[f.tier];
  return [
    `License ${f.licenseNo}`,
    `${f.title}: ${t.label} license`,
    `Holder: ${f.holder}${f.organization ? ` (${f.organization})` : ""}`,
    `Issued ${f.issuedAt.toISOString().slice(0, 10)} to ${f.email}`,
    "",
    ...t.terms,
    ...COMMON_TERMS,
  ];
}
