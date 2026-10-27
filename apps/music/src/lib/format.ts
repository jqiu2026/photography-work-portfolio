/** "6 min" or "1 h 5 min" from seconds; empty for no value. */
export function duration(sec: number | null | undefined): string {
  if (!sec || sec < 1) return "";
  if (sec < 60) return `${Math.round(sec)} s`;
  const m = Math.round(sec / 60);
  return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60 ? `${m % 60} min` : ""}`.trim() : `${m} min`;
}

export const usd = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

export const LEVEL: Record<string, string> = { easy: "Easy", medium: "Medium", advanced: "Advanced" };
export const TIER_LABEL: Record<string, string> = {
  personal: "Personal",
  ensemble: "Ensemble",
  institution: "Institution",
};
