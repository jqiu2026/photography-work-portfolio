import "server-only";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { ImageSource } from "@jerryqiu/media";

/**
 * Photographs that ship with the app (the repo portfolio and case-study images, the fallback when no database is
 * configured). They live in `private/opt/<group>/` (NOT `public/`), so no file is addressable by URL: every one is
 * served through `/api/img/[id]` with a signed token, exactly like a CMS photograph. Ids are stable UUIDs derived from
 * the group and key, so they never change between builds. The optimised derivatives and manifests are made by
 * `scripts/optimize-images.mjs`; originals sit in `private/images` and are never served.
 */
const ROOT = path.join(process.cwd(), "private", "opt");

type Raw = { width: number; height: number; color?: string; blur?: string; files: { width: number; src: string }[] };
export type StaticAsset = { id: string; width: number; height: number; color?: string; blur?: string; files: [] };

const groups = new Map<string, Record<string, Raw>>();
const byId = new Map<string, { group: string; raw: Raw }>();
const loaded = new Set<string>();

export function staticId(group: string, key: string): string {
  const h = createHash("sha1").update(`jq-static:${group}:${key}`).digest("hex");
  const v = ((Number.parseInt(h.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, "0");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-${v}${h.slice(18, 20)}-${h.slice(20, 32)}`;
}

function load(group: string) {
  if (loaded.has(group)) return;
  loaded.add(group);
  const file = path.join(ROOT, group, "manifest.json");
  if (!fs.existsSync(file)) return;
  const m = JSON.parse(fs.readFileSync(file, "utf8")) as Record<string, Raw>;
  groups.set(group, m);
  for (const [key, raw] of Object.entries(m)) byId.set(staticId(group, key), { group, raw });
}

/** What pages need: dimensions and a placeholder, never a file URL. */
export function staticAsset(group: string, key: string): StaticAsset {
  load(group);
  const raw = groups.get(group)?.[key];
  if (!raw) throw new Error(`Image not found: ${group}/${key}`);
  return {
    id: staticId(group, key),
    width: raw.width,
    height: raw.height,
    color: raw.color,
    blur: raw.blur,
    files: [],
  };
}

/** For the image route: derivative files for a bundled photograph, or null. */
export function resolveStatic(id: string): ImageSource | null {
  for (const g of ["gallery", "projects"]) load(g);
  const hit = byId.get(id);
  if (!hit) return null;
  const derivatives = hit.raw.files.map((f) => ({
    width: f.width,
    format: "webp",
    key: `${hit.group}/${path.basename(f.src)}`,
  }));
  return {
    derivatives,
    async get(key) {
      const file = path.resolve(ROOT, key);
      if (!file.startsWith(`${ROOT}${path.sep}`) || !fs.existsSync(file)) return null;
      return { body: new Uint8Array(await fs.promises.readFile(file)), contentType: "image/webp" };
    },
  };
}
