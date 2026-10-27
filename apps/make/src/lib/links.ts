/** Links are typed one per line as `label | https://address | kind` (kind is demo, source, writeup or other, default other). */
export function parseLinks(text: string) {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const [label = "", url = "", kind = "other"] = line.split("|").map((x) => x.trim());
      return { label, url, kind: (["demo", "source", "writeup", "other"].includes(kind) ? kind : "other") as "demo" };
    });
}

/** The inverse, for the edit form. */
export function linksToText(links: { label: string; url: string; kind: string }[]): string {
  return links.map((l) => `${l.label} | ${l.url} | ${l.kind}`).join("\n");
}
