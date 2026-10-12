// Contrast check for the Halation palette (WCAG 2.2 AA: text 4.5, large text and non-text 3).
// usage: node scripts/contrast.mjs   (exits 1 on a failure)
const lum = (h) => {
  const c = [1, 3, 5]
    .map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const cr = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const themes = {
  Night: {
    field: "#07080c",
    ink: "#eceff5",
    dim: "#a2a9ba",
    blue: "#6f9bff",
    red: "#ff6a5e",
    amber: "#ffcb47",
    green: "#4fe0a0",
  },
  Day: {
    field: "#f3f1ec",
    ink: "#0b0d12",
    dim: "#545a68",
    blue: "#1d48c9",
    red: "#b3251e",
    amber: "#7a5c00",
    green: "#0a6b46",
  },
  Cinema: {
    field: "#000000",
    ink: "#eceff5",
    dim: "#a2a9ba",
    blue: "#6f9bff",
    red: "#ff6a5e",
    amber: "#ffcb47",
    green: "#4fe0a0",
  },
};
let bad = 0;
for (const [name, t] of Object.entries(themes)) {
  const row = ["ink", "dim", "blue", "red", "amber", "green"].map((k) => {
    const r = cr(t.field, t[k]);
    if (r < 4.5) bad++;
    return `${k} ${r.toFixed(2)}`;
  });
  console.log(name.padEnd(7), row.join("  "));
}
if (bad) {
  console.error(`${bad} pairing(s) below 4.5:1`);
  process.exit(1);
}
