import "server-only";
import { type DownloadKind } from "@jerryqiu/db/galleries";
import { MAX_PART_BYTES, planZipParts } from "@jerryqiu/media";

export type DlItem = { mediaId: string; filename: string; bytes: number | null };

/** Web files average about 1.5 MB; each ZIP part is also capped at 150 web files so one request stays quick. */
export function zipPlan(items: DlItem[], size: DownloadKind) {
  const sized = items.map((i) => ({
    ...i,
    name: i.filename,
    bytes: size === "full" ? (i.bytes ?? 12_000_000) : 1_500_000,
  }));
  return planZipParts(sized, MAX_PART_BYTES, size === "full" ? 400 : 150);
}

export const baseName = (f: string) => f.replace(/\.[^.]+$/, "");
