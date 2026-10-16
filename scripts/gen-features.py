#!/usr/bin/env python3
"""Regenerates apps/photos/src/content/features.ts from the feature table in docs/project/01-photo-site-spec.md.
Run after changing a status in the spec; apps/photos/test/features.test.ts fails if the two disagree."""
import json, re, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
s = (root / "docs/project/01-photo-site-spec.md").read_text()
sec = s[s.index("## 6. Feature table"):s.index("## 7. Marketing")]
group, rows, groups = None, [], []
for line in sec.split("\n"):
    if line.startswith("### "):
        group = line[4:].strip()
        if group not in groups: groups.append(group)
        continue
    m = re.match(r"\| (F-\d+) \| (.*?) \| (P1/P2|P1/P3|P2/P3|P1|P2|P3|OPT) \| (.*?) \|", line)
    if m:
        fid, title, pri, status = m.groups()
        st = "live" if status.startswith("done") else ("preview" if status.startswith(("partial", "mock")) else "soon")
        rows.append((group, fid, title, pri, st))
out = '''/**
 * The platform's features as the site presents them. GENERATED from the feature table in docs/project/01-photo-site-spec.md by
 * scripts/gen-features.py (a test fails if this file and the spec disagree), so the marketing pages cannot claim more than the
 * product does. Live = works and is tested. Preview = partly built, or built on a labelled mock. Soon = planned, not built.
 */
export type FeatureStatus = "live" | "preview" | "soon";
export type Feature = { id: string; group: string; title: string; priority: string; status: FeatureStatus };

export const featureGroups = [
''' + ",\n".join("  " + json.dumps(g) for g in groups) + ''',
] as const;

export const features: Feature[] = [
''' + "".join(f"  {{ id: {json.dumps(i)}, group: {json.dumps(g)}, title: {json.dumps(t)}, priority: {json.dumps(p)}, status: {json.dumps(st)} }},\n" for g, i, t, p, st in rows) + '''];

export const statusLabel: Record<FeatureStatus, string> = { live: "Live", preview: "Preview", soon: "Soon" };

export const counts = () => ({
  live: features.filter((f) => f.status === "live").length,
  preview: features.filter((f) => f.status === "preview").length,
  soon: features.filter((f) => f.status === "soon").length,
});
'''
(root / "apps/photos/src/content/features.ts").write_text(out)
print(len(rows), "features")
