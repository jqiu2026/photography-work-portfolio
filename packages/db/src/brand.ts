import { z } from "zod";
import type { Database } from "./client";
import { getStudioSetting, setStudioSetting } from "./calendar";
import { StudioError } from "./errors";

/**
 * The studio's brand and contact details. Shown in every gallery's About tab and footer and in client emails, so it is only
 * what the owner chose to publish. Stored as one studio setting; defaults are the facts already public on the site.
 */
export const brandSchema = z.object({
  name: z.string().trim().max(80).default("Jerry Qiu"),
  website: z.string().trim().max(120).default("jerryqiu.com"),
  instagram: z.string().trim().max(60).default("jqiu2026"),
  facebook: z.string().trim().max(160).default(""),
  twitter: z.string().trim().max(60).default(""),
  pinterest: z.string().trim().max(60).default(""),
  email: z.string().trim().max(160).default("hello@jerryqiu.com"),
  phone: z.string().trim().max(40).default(""),
  addressLine1: z.string().trim().max(120).default(""),
  addressLine2: z.string().trim().max(120).default(""),
  city: z.string().trim().max(80).default(""),
  region: z.string().trim().max(40).default(""),
  postalCode: z.string().trim().max(20).default(""),
  country: z.string().trim().max(2).default("US"),
  timezone: z.string().trim().max(60).default("America/New_York"),
  /** Shown publicly in galleries and emails only when ticked: the address and phone are private by default. */
  showPhone: z.boolean().default(false),
  showAddress: z.boolean().default(false),
});
export type Brand = z.infer<typeof brandSchema>;
export const getBrand = (db: Database) => getStudioSetting(db, "brand", brandSchema);
export async function saveBrand(db: Database, patch: Partial<Brand>) {
  const r = brandSchema.safeParse({ ...(await getBrand(db)), ...patch });
  if (!r.success) throw new StudioError(r.error.issues[0]?.message ?? "Check the brand details.");
  if (r.data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(r.data.email))
    throw new StudioError("Enter a valid email address.");
  if (!r.data.name) throw new StudioError("Give the brand a name.");
  await setStudioSetting(db, "brand", r.data);
  return r.data;
}
/** What a gallery may show the public. */
export const publicBrand = (b: Brand) => ({
  name: b.name,
  website: b.website,
  instagram: b.instagram,
  email: b.email,
  phone: b.showPhone ? b.phone : "",
  address: b.showAddress
    ? [b.addressLine1, b.addressLine2, [b.city, b.region, b.postalCode].filter(Boolean).join(" ")]
        .filter(Boolean)
        .join(", ")
    : "",
});
