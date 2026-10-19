import { DataList, DataListItem } from "@/components/ui";
import { getDb } from "@jerryqiu/db";
import * as com from "@jerryqiu/db/commerce";
import * as forms from "@jerryqiu/db/forms";
import { formatMoney } from "@jerryqiu/db/pricing";
import type { Metadata } from "next";
import { Page } from "@/components/Marketing";
import { getPublicCatalog } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Terms",
  description: "Gallery access, extensions, deposits and cancellations.",
};
export const dynamic = "force-dynamic";

export default async function Terms() {
  const db = getDb();
  const p = db ? await forms.getPolicies(db) : forms.policiesSchema.parse({});
  const pay = db ? await com.getPaymentsSettings(db) : com.paymentsSettingsSchema.parse({});
  const { addOns } = await getPublicCatalog();
  const fee = p.extensionFeeIsSample ? "$XX" : formatMoney(p.extensionFeeCents);
  return (
    <Page title="Terms" lede="The plain-language rules for booking, paying and keeping your gallery.">
      {/* TODO(owner, lawyer): these terms are a draft for professional review. */}
      <p className="pk-note" role="note">
        Draft terms: figures marked $XX are placeholders until real prices are set.
      </p>
      <h2>Deposits and payment</h2>
      <p>
        A deposit ({pay.depositPercent}% of the amount due, a placeholder until set) holds your date. The rest is due as
        the invoice says. Sales tax, where it applies, is shown as its own line on your quote. Fees charged by the
        payment provider are included in the price or shown as their own line before you pay.
      </p>
      <h2>Cancelling and moving a date</h2>
      <p>
        You can move or cancel from your portal up to {p.cancellationDays} days before the shoot. Inside that window,
        message me. What happens to the deposit is set out in your contract.
      </p>
      <h2>How long your gallery stays online</h2>
      <p>
        Your gallery is online for {p.galleryAccessMonths} months after delivery, then archived. You can extend access
        for {fee} per additional {p.extensionMonths} months, and an archived gallery can be reactivated for the same
        fee. Download what you want to keep before it expires.
      </p>
      <h2>Extras and their prices</h2>
      <DataList className="mk-list">
        {addOns.map((a) => (
          <DataListItem key={a.name} description={a.unit} meta={a.price}>
            {a.name}
          </DataListItem>
        ))}
      </DataList>
      <h2>Your photographs and license</h2>
      <p>
        I keep the copyright. You receive the license in your contract (usually personal, non-commercial use).
        Commercial use needs a separate license.
      </p>
      <h2>Your data</h2>
      <p>You can ask me to export or delete everything I hold about you. See the privacy page.</p>
    </Page>
  );
}
