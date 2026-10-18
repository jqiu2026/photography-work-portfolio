import {
  Badge,
  Button,
  PricingCard,
  PricingFeature,
  PricingFeatures,
  PricingFooter,
  PricingGrid,
  PricingName,
  PricingPrice,
  PricingTagline,
} from "@holominimal/ui";
import { PageHeader } from "@/components/PageHeader";
import { Alert, Container, DataList, DataListItem, Heading, Section, Text } from "@/components/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { Shell } from "@/components/Shell";
import { getPublicCatalog } from "@/lib/catalog";
import "../globals.css";

export const metadata: Metadata = {
  title: "Packages",
  description: "What each package includes, and what the extras cost on their own.",
};
export const dynamic = "force-dynamic";

export default async function Packages() {
  const { packages, addOns, anySample } = await getPublicCatalog();
  return (
    <Shell>
      <PageHeader
        eyebrow="Pricing"
        title="Packages"
        intro="Packages list what you receive: coverage time, edited images and how long your gallery stays online. Mandatory fees are inside the price. Optional extras are listed separately, with their own prices, so you can compare a bundle with buying it alone."
      >
        {anySample ? (
          <Alert tone="info" role="note" className="pk-note">
            SAMPLE: the contents below are an example and every price shows as $XX until the real prices are set.
          </Alert>
        ) : null}
      </PageHeader>
      <Section style={{ paddingTop: 0 }}>
        <Container>
          <PricingGrid aria-label="Packages">
            {packages.map((p) => (
              <PricingCard key={p.id} as="li" featured={p.featured} featuredLabel="Most booked">
                <PricingName as="h2">{p.name}</PricingName>
                {p.tagline ? <PricingTagline>{p.tagline}</PricingTagline> : null}
                <PricingPrice>
                  {p.price} {p.isSample ? <Badge tone="warning">SAMPLE</Badge> : null}
                </PricingPrice>
                <PricingFeatures>
                  {p.deliverables.map((d) => (
                    <PricingFeature key={d.label} value={d.value}>
                      {d.label}
                    </PricingFeature>
                  ))}
                  {p.included.map((i) => (
                    <PricingFeature key={i.name} value={`worth ${i.standalone}`}>
                      Includes {i.name}
                    </PricingFeature>
                  ))}
                </PricingFeatures>
                <PricingFooter>
                  {p.fees.length ? (
                    <Text size="xs" tone="muted">
                      {p.fees.join(", ")}
                    </Text>
                  ) : null}
                  <Button asChild variant={p.featured ? "primary" : "secondary"}>
                    <Link href="/book">Ask about {p.name}</Link>
                  </Button>
                </PricingFooter>
              </PricingCard>
            ))}
          </PricingGrid>
          <section aria-labelledby="pk-extras" className="pk-extras">
            <Heading level={2} size="xl" id="pk-extras">
              Extras, on their own
            </Heading>
            <DataList aria-label="Add-ons and fees">
              {addOns.map((a) => (
                <DataListItem
                  key={a.name}
                  description={a.description || undefined}
                  meta={
                    <>
                      <strong className="pk-amount">{a.price}</strong> {a.unit}
                      {a.isFee ? " · optional fee" : ""}
                    </>
                  }
                >
                  {a.name}
                </DataListItem>
              ))}
            </DataList>
          </section>
          <div className="pk-actions">
            <Button asChild size="lg">
              <Link href="/book">Ask about a shoot</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/book/schedule">Pick a time</Link>
            </Button>
          </div>
          <Text size="sm" tone="muted" style={{ marginTop: "var(--hm-space-4)" }}>
            Sales tax, where it applies, is shown as its own line on your quote.
          </Text>
        </Container>
      </Section>
    </Shell>
  );
}
