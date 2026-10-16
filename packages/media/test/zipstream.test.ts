import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { crc32 } from "node:zlib";
import { describe, expect, it } from "vitest";
import { planZipParts, zipNames, zipStream } from "../src/zipstream";

async function collect(s: ReadableStream<Uint8Array>) {
  const chunks: Buffer[] = [];
  const reader = s.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks);
}

describe("zip parts", () => {
  it("keeps parts under the byte and file caps, in order, and never drops a file", () => {
    const items = Array.from({ length: 10 }, (_, i) => ({ name: `p${i}.jpg`, bytes: 400 }));
    const parts = planZipParts(items, 1000, 3);
    expect(parts.map((p) => p.length)).toEqual([2, 2, 2, 2, 2]); // 800 bytes fit, a third would pass 1000
    expect(parts.flat().map((x) => x.name)).toEqual(items.map((x) => x.name));
    expect(planZipParts([{ name: "big", bytes: 5000 }], 1000, 3)).toEqual([[{ name: "big", bytes: 5000 }]]);
    expect(planZipParts([], 1000, 3)).toEqual([]);
    expect(planZipParts(items, 10_000, 3).map((p) => p.length)).toEqual([3, 3, 3, 1]);
  });
  it("makes safe unique names", () => {
    expect(zipNames(["a.jpg", "A.jpg", "../evil.jpg", "dir/x:y.jpg", ".hidden", ""])).toEqual([
      "a.jpg",
      "A (2).jpg",
      "__evil.jpg",
      "dir_x_y.jpg",
      "_hidden",
      "photo",
    ]);
  });
});

describe("zipStream", () => {
  it("writes a ZIP that the system unzip accepts, with the right CRCs and bytes", async () => {
    const a = Buffer.from("first file contents");
    const b = Buffer.alloc(5000, 7);
    const zip = await collect(
      zipStream([
        { name: "one.txt", read: async () => a },
        { name: "two.bin", read: async () => b },
        { name: "one.txt", read: async () => Buffer.from("dup") },
      ]),
    );
    expect(zip.readUInt32LE(0)).toBe(0x04034b50);
    expect(zip.readUInt32LE(14)).toBe(crc32(a));
    const dir = mkdtempSync(path.join(os.tmpdir(), "jq-zip-"));
    const file = path.join(dir, "t.zip");
    writeFileSync(file, zip);
    let ok = true;
    try {
      const out = execFileSync("unzip", ["-t", file], { encoding: "utf8" });
      expect(out).toContain("No errors detected");
      expect(out).toContain("one (2).txt");
      execFileSync("unzip", ["-o", "-d", dir, file]);
      expect(readFileSync(path.join(dir, "one.txt"))).toEqual(a);
      expect(readFileSync(path.join(dir, "two.bin"))).toEqual(b);
    } catch (e) {
      if ((e as { code?: string }).code === "ENOENT") ok = false;
      else throw e;
    }
    if (!ok) console.warn("unzip not installed: skipped the external check");
  });
  it("is lazy: files are read one at a time as the stream is consumed", async () => {
    const reads: string[] = [];
    const s = zipStream(
      [1, 2, 3].map((n) => ({
        name: `${n}.txt`,
        read: async () => {
          reads.push(String(n));
          return Buffer.from(String(n));
        },
      })),
    );
    const r = s.getReader();
    await r.read();
    expect(reads.length).toBeLessThanOrEqual(2);
    await r.cancel();
  });
});
