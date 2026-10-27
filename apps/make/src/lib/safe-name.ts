/** A file name that is safe inside a storage key: letters, digits, dot, dash, underscore. */
export function safeKeyName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "file";
  const clean = base
    .normalize("NFKD")
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/^[-.]+/, "")
    .slice(-120);
  return clean || "file";
}
