import { Container, Section, Text } from "@/components/ui";
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
      <Container className="page-head">
        <h1 className="hl-heading hl-heading--display">Packages</h1>
        <Text size="xl" tone="muted" style={{ marginTop: "1.5rem", maxWidth: "40ch" }}>
          Packages list what you receive: coverage time, edited images and how long your gallery stays online. Mandatory
          fees are inside the price. Optional extras are listed separately, with their own prices, so you can compare a
          bundle with buying it alone.
        </Text>
        {anySample ? (
          <p className="pk-note" role="note">
            SAMPLE: the contents below are an example and every price shows as $XX until the real prices are set.
          </p>
        ) : null}
      </Container>
      <Section style={{ paddingTop: 0 }}>
        <Container>
          <ul className="pk-grid" aria-label="Packages">
            {packages.map((p) => (
              <li key={p.id} className="pk-card" data-featured={p.featured || undefined}>
                <h2>{p.name}</h2>
                {p.tagline ? <p className="pk-tag">{p.tagline}</p> : null}
                <p className="pk-price">
                  {p.price} {p.isSample ? <small>SAMPLE</small> : null}
                </p>
                <ul className="pk-list">
                  {p.deliverables.map((d) => (
                    <li key={d.label}>
                      <span>{d.label}</span>
                      <strong>{d.value}</strong>
                    </li>
                  ))}
                  {p.included.map((i) => (
                    <li key={i.name}>
                      <span>Includes {i.name}</span>
                      <strong>worth {i.standalone}</strong>
                    </li>
                  ))}
                </ul>
                {p.fees.length ? <p className="pk-fee">{p.fees.join(", ")}</p> : null}
              </li>
            ))}
          </ul>
          <h2 className="hl-heading" style={{ marginTop: "3rem", fontSize: "var(--hl-text-2xl)" }}>
            Extras, on their own
          </h2>
          <ul className="pk-extras" aria-label="Add-ons and fees">
            {addOns.map((a) => (
              <li key={a.name}>
                <span>
                  <strong>{a.name}</strong>
                  {a.description ? <small>{a.description}</small> : null}
                </span>
                <span>
                  {a.price}{" "}
                  <small>
                    {a.unit}
                    {a.isFee ? " · optional fee" : ""}
                  </small>
                </span>
              </li>
            ))}
          </ul>
          <p style={{ marginTop: "2rem" }}>
            <Link href="/book" className="hl-link">
              Ask about a shoot
            </Link>
            {" · "}
            <Link href="/book/schedule" className="hl-link">
              Pick a time
            </Link>
          </p>
          <Text size="sm" tone="muted" style={{ marginTop: "1rem" }}>
            Sales tax, where it applies, is shown as its own line on your quote.
          </Text>
        </Container>
      </Section>
    </Shell>
  );
}
