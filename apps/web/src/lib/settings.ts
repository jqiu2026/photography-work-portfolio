import { z } from "zod";

/**
 * Per-site settings live in the `settings` table as (site, key) -> JSON. Each key has one zod schema here, used by the
 * admin to validate writes and by the public content layer to read values safely (bad or missing data -> defaults).
 */
const text = (max: number) => z.string().trim().max(max);
const internalPath = z
  .string()
  .trim()
  .max(300)
  .refine((v) => /^(\/(?!\/)|https:\/\/|mailto:)/.test(v), "Use a path like /about or a full https:// link");

export const settingSchemas = {
  general: z.object({
    siteName: text(80),
    tagline: text(160),
    contactEmail: z
      .string()
      .trim()
      .max(200)
      .regex(/^([^\s@]+@[^\s@]+\.[^\s@]+)?$/, "Not an email address"),
    maintenance: z.boolean(),
    maintenanceMessage: text(400),
  }),
  home: z.object({
    heroHeadline: text(160),
    heroIntro: text(600),
    aboutIntro: text(1200),
  }),
  seo: z.object({
    title: text(70),
    description: text(170),
    ogImageMediaId: z.string().uuid().or(z.literal("")),
  }),
  theme: z.object({ accent: z.enum(["default", "blue", "red", "yellow", "green"]) }),
  protection: z.object({
    level: z.enum(["off", "light", "strict"]),
    watermark: z.boolean(),
    watermarkText: text(60),
    watermarkPosition: z.enum(["bottom-right", "bottom-left", "center"]),
    watermarkOpacity: z.coerce.number().min(0.05).max(0.8),
  }),
  nav: z.object({ items: z.array(z.object({ label: text(40).min(1), href: internalPath })).max(12) }),
} as const;

export type SettingKey = keyof typeof settingSchemas;
export type SettingValue<K extends SettingKey> = z.infer<(typeof settingSchemas)[K]>;

export const settingDefaults: { [K in SettingKey]: SettingValue<K> } = {
  general: { siteName: "", tagline: "", contactEmail: "", maintenance: false, maintenanceMessage: "" },
  home: { heroHeadline: "", heroIntro: "", aboutIntro: "" },
  seo: { title: "", description: "", ogImageMediaId: "" },
  theme: { accent: "default" },
  protection: {
    level: "light",
    watermark: false,
    watermarkText: "",
    watermarkPosition: "bottom-right",
    watermarkOpacity: 0.3,
  },
  nav: { items: [] },
};

/** Reads a stored value, falling back to defaults field by field when the stored JSON is missing or malformed. */
export function readSetting<K extends SettingKey>(key: K, stored: unknown): SettingValue<K> {
  const base = settingDefaults[key];
  const parsed = settingSchemas[key].safeParse({ ...base, ...(typeof stored === "object" && stored ? stored : {}) });
  return (parsed.success ? parsed.data : base) as SettingValue<K>;
}

/** "Label | /path" per line -> nav items (and back) so the owner edits navigation as plain text. */
export function parseNavLines(src: string): { label: string; href: string }[] {
  return src
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [label, ...rest] = l.split("|");
      return { label: (label ?? "").trim(), href: rest.join("|").trim() };
    });
}
export const navToLines = (items: { label: string; href: string }[]) =>
  items.map((i) => `${i.label} | ${i.href}`).join("\n");
