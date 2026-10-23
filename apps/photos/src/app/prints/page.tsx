import { getDb } from "@jerryqiu/db";
import * as shop from "@jerryqiu/db/gallery-shop";
import { priceLabel } from "@jerryqiu/db/pricing";
import { PPI_FLOOR } from "@jerryqiu/prints";
import { mocksEnabled } from "@jerryqiu/mocks";
import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Page } from "@/components/Marketing";
import { Button } from "@/components/ui";
import { LINES, ensurePortfolioStore, labCatalog, syncPrintCatalog } from "@/lib/print-catalog";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Prints",
  description: "Prints, canvases, metal prints, cards and albums of the portfolio, made by a professional lab.",
};

/**
 * The print store: what can be ordered and how big a photograph has to be. Prints of portfolio photographs are ordered
 * in the store gallery (/g/prints), which uses the same cart, payment and lab flow as any client gallery. Prices are
 * shown as $XX until the owner sets real ones; the lab is a labelled sample until WHCC's credentials exist.
 */
export default async function Prints() {
  const db = getDb();
  const { products: lab, provider } = await labCatalog();
  let store: { slug: string } | null = null;
  let priced = new Map<string, { cents: number; sample: boolean }>();
  if (db && lab.length) {
    try {
      await syncPrintCatalog(db);
      store = await ensurePortfolioStore(db);
      const rows = await shop.listProducts(db, { activeOnly: true });
      priced = new Map(
        rows.filter((r) => r.sku).map((r) => [r.sku as string, { cents: r.priceCents, sample: r.sample }]),
      );
    } catch (error) {
      // the store is optional: the catalog below still reads fine
      console.error("[prints] the store could not be prepared", error);
    }
  }
  const mock = provider === "mock" && mocksEnabled();
  return (
    <Page
      title="Prints"
      lede="Prints, canvases, metal prints, cards and albums of the work, made by a professional lab and shipped to you."
    >
      <p>
        <Badge status="preview" />{" "}
        {mock
          ? "This runs on a sample lab: you can try the whole order, and nothing is printed or shipped. The real lab is connected when its account exists."
          : "Orders are sent to the lab only after payment is confirmed."}
      </p>
      {store ? (
        <p>
          <Button asChild size="lg">
            <Link href={`/g/${store.slug}`}>Choose a photograph</Link>
          </Button>
        </p>
      ) : (
        <p>
          Want a print now? <Link href="/book?type=licensing">Ask me</Link>.
        </p>
      )}
      {lab.length ? (
        LINES.map((line) => {
          const items = lab.filter((p) => p.kind === line.kind);
          if (!items.length) return null;
          return (
            <section key={line.kind} className="pr-line" aria-labelledby={`pr-${line.kind}`}>
              <h2 id={`pr-${line.kind}`}>{line.title}</h2>
              <p>{line.blurb}</p>
              <ul className="pr-grid">
                {items.map((p) => {
                  const price = priced.get(p.sku);
                  return (
                    <li key={p.sku}>
                      <strong>{p.name.replace(" (SAMPLE)", "").replace(/ x /g, " × ")}</strong>
                      <span className="pr-price">{price ? priceLabel(price.cents, price.sample) : "$XX"}</span>
                      <small>
                        Needs a photograph about {Math.max(p.widthIn, p.heightIn) * PPI_FLOOR} px on the long side
                      </small>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })
      ) : (
        <p>The print lab is not connected yet, so there is nothing to order here today.</p>
      )}
      <p>
        <small>
          Only sizes a photograph is sharp enough for are offered when you choose it (180 pixels per inch or more).
          Shipping is its own line, tax is shown before you pay, and every price here is a placeholder until it is set.
        </small>
      </p>
    </Page>
  );
}
