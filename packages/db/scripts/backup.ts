// Writes a full content backup (JSON + Markdown + media manifest) to a folder OUTSIDE the repo and a .zip beside it.
// Usage: pnpm db:backup [target-dir]      (default: ~/jerryqiu-backups/<timestamp>)
import { mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { getDb } from "../src";
import { exportAll } from "../src/export";
import { zip } from "../src/zip";

const db = getDb();
if (!db) {
  console.error("DATABASE_URL is not set (or the dev database is not running: `pnpm dev:db`).");
  process.exit(1);
}
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const dir = path.resolve(process.argv[2] ?? path.join(homedir(), "jerryqiu-backups", stamp));
const files = await exportAll(db);
for (const [name, content] of Object.entries(files)) {
  const target = path.join(dir, name);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, content);
}
writeFileSync(`${dir}.zip`, zip(files));
console.log(`Backed up ${Object.keys(files).length} files to ${dir} (and ${dir}.zip)`);
process.exit(0);
