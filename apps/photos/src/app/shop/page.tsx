import { getDb } from "@jerryqiu/db";
import { listedGalleries, listProducts } from "@jerryqiu/db/gallery-shop";
import type { Metadata } from "next";
import Link from "next/link";
import { Page } from "@/components/Marketing";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Shop",
  description: "Prints and digital downloads of photographs from client galleries.",
};

const usd = (c: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(c / 100);

/** Where prints and downloads are sold: each gallery has its own shop; this page explains how and lists the galleries that are open. */
export default async function Shop() {
  const db = getDb();
  const [galleries, products] = db
    ? await Promise.all([listedGalleries(db), listProducts(db, { activeOnly: true })])
    : [[], []];
  return (
    <Page title="Shop" lede="Prints and downloads come from the gallery of the shoot they belong to.">
      <section>
        <h2>How it works</h2>
        <ol>
          <li>Open the gallery link you were sent, or one listed below.</li>
          <li>
            Open a photograph. Choose a download or a print size; sizes the photograph is too small for are not offered.
          </li>
          <li>
            Pay by card on the next page. Downloads unlock right away; prints are ordered from the lab once payment
            clears.
          </li>
        </ol>
        <p>
          If you were given a passcode, <Link href="/client">enter it here</Link> to proof and download what is yours.
        </p>
      </section>
      {galleries.length ? (
        <section>
          <h2>Open galleries</h2>
          <ul>
            {galleries.map((g) => (
              <li key={g.id}>
                <Link href={`/g/${g.slug}`}>{g.title}</Link>
                {g.welcome ? <> · {g.welcome}</> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section>
          <h2>Open galleries</h2>
          <p>No gallery is listed here right now. Your gallery link opens its own shop.</p>
        </section>
      )}
      {products.length ? (
        <section>
          <h2>Price list</h2>
          <ul>
            {products.map((p) => (
              <li key={p.id}>
                {p.name}: {usd(p.priceCents)}
                {p.sample ? " (SAMPLE price)" : ""}
              </li>
            ))}
          </ul>
          <p>Shipping for prints is added at checkout. Prices marked SAMPLE are placeholders until they are set.</p>
        </section>
      ) : null}
    </Page>
  );
}
