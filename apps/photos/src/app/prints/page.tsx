import { getDb } from "@jerryqiu/db";
import * as shop from "@jerryqiu/db/gallery-shop";
import { priceLabel } from "@jerryqiu/db/pricing";
import { PPI_FLOOR } from "@jerryqiu/prints";
import { mocksEnabled } from "@jerryqiu/mocks";
import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Page } from "@/components/Marketing";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@holominimal/ui";
import { LINES, ensurePrintCatalog, labCatalog } from "@/lib/print-catalog";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Prints",
  description: "Prints, canvases, metal prints, cards and albums of the portfolio, made by a professional lab.",
};

/**
 * What can be ordered and how big a photograph has to be. Prints are bought inside a gallery (open a photograph, choose
 * a size), which uses the same cart, payment and lab flow for every gallery. Prices are shown as $XX until the owner
 * sets real ones; the lab is a labelled sample until WHCC's credentials exist.
 */
export default async function Prints() {
  const db = getDb();
  const { products: lab, provider } = await labCatalog();
  let priced = new Map<string, { cents: number; sample: boolean }>();
  if (db && lab.length) {
    try {
      await ensurePrintCatalog(db);
      const rows = await shop.listProducts(db, { activeOnly: true });
      priced = new Map(
        rows.filter((r) => r.sku).map((r) => [r.sku as string, { cents: r.priceCents, sample: r.sample }]),
      );
    } catch (error) {
      // the catalog below still reads fine without prices
      console.error("[prints] prices could not be read", error);
    }
  }
  const mock = provider === "mock" && mocksEnabled();
  const groups = LINES.map((line) => ({ line, items: lab.filter((p) => p.kind === line.kind) })).filter(
    (g) => g.items.length,
  );
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
      <p>
        Prints are ordered from inside your gallery: open a photograph and pick a size, a paper or a finish. Want a
        print of something from the portfolio? <Link href="/book?type=licensing">Ask me</Link>.
      </p>
      {groups.length ? (
        <Accordion type="multiple" defaultValue={groups.slice(0, 1).map((g) => g.line.kind)} className="pr-groups">
          {groups.map(({ line, items }) => (
            <AccordionItem key={line.kind} value={line.kind}>
              <AccordionTrigger>
                {line.title} <small>({items.length})</small>
              </AccordionTrigger>
              <AccordionContent>
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
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
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
