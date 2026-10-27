/**
 * Rights type per piece. The store button is only on for a piece the owner may sell: their own music, an arrangement of a
 * public-domain work, or an arrangement of a copyrighted work once a license is on file (Q34, other-sites.md).
 */
export type RightsType = "original" | "public-domain-arrangement" | "arrangement-copyrighted";

export const RIGHTS_LABELS: Record<RightsType, string> = {
  original: "Original composition",
  "public-domain-arrangement": "Arrangement of a public-domain work",
  "arrangement-copyrighted": "Arrangement of a copyrighted work",
};

export type SellableInput = {
  status: "draft" | "published";
  rightsType: RightsType;
  licenseOnFile: boolean;
};

export type SellableResult = { ok: true } | { ok: false; reason: string };

export function canSell(w: SellableInput): SellableResult {
  if (w.status !== "published") return { ok: false, reason: "This piece is not published." };
  if (w.rightsType === "arrangement-copyrighted" && !w.licenseOnFile)
    return {
      ok: false,
      reason:
        "This is an arrangement of a copyrighted work. It is not for sale until the arranging license is on file.",
    };
  return { ok: true };
}
