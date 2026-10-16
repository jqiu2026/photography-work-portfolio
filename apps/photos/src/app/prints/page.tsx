import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Page } from "@/components/Marketing";

export const metadata: Metadata = { title: "Prints", description: "Prints, albums and cards are coming." };

export default function Prints() {
  return (
    <Page title="Prints" lede="Ordering prints, canvases, albums and cards straight from your gallery.">
      <p>
        <Badge status="soon" /> This is planned and not built yet. The ordering flow will run on a labelled test lab
        first; the real print lab is connected only once its account exists.
      </p>
      <p>
        What to expect: products shown only when your photograph is large enough to print well, shipping as its own
        line, tax shown before you pay, and an order sent to the lab only after payment is confirmed. Prices will appear
        here when they are set; until then none are shown.
      </p>
      <p>
        Want a print now? <Link href="/book/licensing">Ask me</Link>.
      </p>
    </Page>
  );
}
