import { crc32 } from "node:zlib";

/**
 * Streaming "store" ZIP (no compression: photographs are already compressed). Each file is read, written and released in
 * turn, so a gallery never has to fit in memory at once. No ZIP64: `planZipParts` splits a gallery into parts that stay well
 * below 4 GB and 65,000 files, so every part opens everywhere.
 */
export type ZipEntry = { name: string; read: () => Promise<Uint8Array> };
export type Sized = { name: string; bytes: number };

export const MAX_PART_BYTES = 1_500_000_000;
export const MAX_PART_FILES = 1000;

/** Splits files (in order) into parts of at most `maxBytes` and `maxFiles`. A single file larger than the cap gets its own part. */
export function planZipParts<T extends Sized>(items: T[], maxBytes = MAX_PART_BYTES, maxFiles = MAX_PART_FILES): T[][] {
  const parts: T[][] = [];
  let cur: T[] = [];
  let size = 0;
  for (const it of items) {
    if (cur.length && (size + it.bytes > maxBytes || cur.length >= maxFiles)) {
      parts.push(cur);
      cur = [];
      size = 0;
    }
    cur.push(it);
    size += it.bytes;
  }
  if (cur.length) parts.push(cur);
  return parts;
}

/** File names that are safe inside a ZIP, unique within it (a repeat becomes "name (2).ext"). */
export function zipNames(names: string[]): string[] {
  const seen = new Map<string, number>();
  return names.map((raw) => {
    const clean =
      raw
        .replace(/[\\/:*?"<>|]/g, "_")
        // biome-ignore lint/suspicious/noControlCharactersInRegex: control characters are exactly what is being removed
        .replace(/[\x00-\x1f]/g, "_")
        .replace(/^\.+/, "_")
        .slice(0, 150) || "photo";
    const key = clean.toLowerCase();
    const n = (seen.get(key) ?? 0) + 1;
    seen.set(key, n);
    if (n === 1) return clean;
    const dot = clean.lastIndexOf(".");
    return dot > 0 ? `${clean.slice(0, dot)} (${n})${clean.slice(dot)}` : `${clean} (${n})`;
  });
}

const dos = (d: Date) => ({
  time: (d.getUTCHours() << 11) | (d.getUTCMinutes() << 5) | (d.getUTCSeconds() >> 1),
  date: ((d.getUTCFullYear() - 1980) << 9) | ((d.getUTCMonth() + 1) << 5) | d.getUTCDate(),
});

export function zipStream(entries: ZipEntry[], now = new Date()): ReadableStream<Uint8Array> {
  const names = zipNames(entries.map((e) => e.name));
  const { time, date } = dos(now);
  const central: Buffer[] = [];
  let offset = 0;
  let i = 0;
  let finished = false;
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      if (i < entries.length) {
        const data = Buffer.from(await entries[i].read());
        const name = Buffer.from(names[i], "utf8");
        const crc = crc32(data);
        const local = Buffer.alloc(30);
        local.writeUInt32LE(0x04034b50, 0);
        local.writeUInt16LE(20, 4);
        local.writeUInt16LE(0x0800, 6);
        local.writeUInt16LE(0, 8);
        local.writeUInt16LE(time, 10);
        local.writeUInt16LE(date, 12);
        local.writeUInt32LE(crc, 14);
        local.writeUInt32LE(data.length, 18);
        local.writeUInt32LE(data.length, 22);
        local.writeUInt16LE(name.length, 26);
        const cd = Buffer.alloc(46);
        cd.writeUInt32LE(0x02014b50, 0);
        cd.writeUInt16LE(20, 4);
        cd.writeUInt16LE(20, 6);
        cd.writeUInt16LE(0x0800, 8);
        cd.writeUInt16LE(time, 12);
        cd.writeUInt16LE(date, 14);
        cd.writeUInt32LE(crc, 16);
        cd.writeUInt32LE(data.length, 20);
        cd.writeUInt32LE(data.length, 24);
        cd.writeUInt16LE(name.length, 28);
        cd.writeUInt32LE(offset, 42);
        central.push(cd, name);
        controller.enqueue(new Uint8Array(Buffer.concat([local, name])));
        controller.enqueue(new Uint8Array(data));
        offset += 30 + name.length + data.length;
        i++;
        return;
      }
      if (!finished) {
        finished = true;
        const cdBuf = Buffer.concat(central);
        const end = Buffer.alloc(22);
        end.writeUInt32LE(0x06054b50, 0);
        end.writeUInt16LE(entries.length, 8);
        end.writeUInt16LE(entries.length, 10);
        end.writeUInt32LE(cdBuf.length, 12);
        end.writeUInt32LE(offset, 16);
        controller.enqueue(new Uint8Array(Buffer.concat([cdBuf, end])));
        return;
      }
      controller.close();
    },
  });
}
