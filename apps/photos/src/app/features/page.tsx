import { Stat, StatGroup } from "@holominimal/ui";
import { DataList, DataListItem } from "@/components/ui";
import type { Metadata } from "next";
import { Badge, Page } from "@/components/Marketing";
import { counts, featureGroups, features } from "@/content/features";

export const metadata: Metadata = {
  title: "Features",
  description: "Everything the photo platform does, and how far along each part is.",
};

export default function Features() {
  const c = counts();
  return (
    <Page
      title="Features"
      lede="This site is a portfolio and the working platform behind it. Every line below is a real feature of that platform, with an honest status."
    >
      <StatGroup className="mk-count" aria-label="Summary">
        <Stat label="Live" value={c.live} />
        <Stat label="Preview" value={c.preview} />
        <Stat label="Soon" value={c.soon} />
      </StatGroup>
      <p>
        <strong>Live</strong>: built and tested. <strong>Preview</strong>: partly built, or running on a clearly
        labelled stand-in until a real account or key is connected. <strong>Soon</strong>: planned, not built. Nothing
        is listed here that the product cannot do or is not marked.
      </p>
      {featureGroups.map((g) => (
        <section key={g} aria-labelledby={`g-${g}`}>
          <h2 id={`g-${g}`}>{g}</h2>
          <DataList className="mk-list">
            {features
              .filter((f) => f.group === g)
              .map((f) => (
                <DataListItem key={f.id} data-feature={f.id} meta={<Badge status={f.status} />}>
                  {f.title}
                </DataListItem>
              ))}
          </DataList>
        </section>
      ))}
    </Page>
  );
}
